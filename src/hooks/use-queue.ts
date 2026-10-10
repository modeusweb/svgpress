'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { FileStatus, OptimizerSettings, QueueItem } from '@/types';
import { queueReducer, initialQueueState, makeId } from '@/lib/queue/reducer';
import { computeSummary, isSuccessful } from '@/lib/queue/stats';
import { WorkerPool, type PoolTask } from '@/lib/svgo/pool';
import {
  buildOutputName,
  looksLikeSvg,
  utf8ByteLength,
  validateSvgFile,
} from '@/lib/files';

let CONFIG_VERSION_COUNTER = 0;
export function configVersion(settings: OptimizerSettings): string {
  CONFIG_VERSION_COUNTER += 1;
  const sig = JSON.stringify(settings).length;
  return `v${CONFIG_VERSION_COUNTER}-${sig}`;
}

export interface AddFilesResult {
  added: number;
  rejected: { name: string; reason: string }[];
}

export interface UseQueueOptions {
  settings: OptimizerSettings;
  concurrency: number;
}

export function useQueue({ settings, concurrency }: UseQueueOptions) {
  const [state, dispatch] = useReducer(queueReducer, initialQueueState);
  const poolRef = useRef<WorkerPool | null>(null);
  const settingsRef = useRef(settings);
  const versionByToken = useRef<Map<number, string>>(new Map());
  const tokenCounter = useRef(0);

  // Keep the latest settings in a ref so the optimize callback always reads
  // current values without needing to be recreated (and without reading refs
  // during render).
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // "Running" is derived from the queue: any queued/optimizing item means work
  // is in progress. This avoids setState-in-effect and stays consistent.
  const isRunning = state.items.some(
    (it) => it.status === 'queued' || it.status === 'optimizing',
  );

  const disposePool = useCallback(() => {
    poolRef.current?.cancel();
    poolRef.current = null;
  }, []);

  useEffect(() => disposePool, [disposePool]);

  /** Add files to the queue. Reads content and validates each. */
  const addFiles = useCallback(async (files: File[]): Promise<AddFilesResult> => {
    const rejected: { name: string; reason: string }[] = [];
    const accepted: QueueItem[] = [];
    const taken = new Set<string>();
    let added = 0;

    for (const f of files) {
      const basic = validateSvgFile(f);
      if (!basic.ok) {
        rejected.push({ name: f.name, reason: basic.reason ?? 'Unsupported file.' });
        continue;
      }
      try {
        const text = await f.text();
        if (!looksLikeSvg(text)) {
          rejected.push({ name: f.name, reason: 'Not a valid SVG document.' });
          continue;
        }
        const originalSize = utf8ByteLength(text);
        const outputName = buildOutputName(f.name, taken);
        accepted.push({
          id: makeId(),
          originalName: f.name,
          outputName,
          originalSize,
          originalContent: text,
          status: 'ready',
        });
        added += 1;
      } catch {
        rejected.push({ name: f.name, reason: 'Could not read file.' });
      }
    }

    if (accepted.length) {
      dispatch({ type: 'add', items: accepted });
    }
    return { added, rejected };
  }, []);

  /** Optimize a specific set of items (by id) or all ready/prior items. */
  const optimize = useCallback(
    (ids?: string[]) => {
      const targets = ids
        ? state.items.filter((it) => ids.includes(it.id))
        : state.items.filter((it) => it.status === 'ready' || it.status === 'no_savings');
      if (targets.length === 0) return;

      const version = configVersion(settingsRef.current);
      const tasks: PoolTask[] = [];
      for (const it of targets) {
        const token = ++tokenCounter.current;
        versionByToken.current.set(token, version);
        tasks.push({
          id: it.id,
          runToken: token,
          svg: it.originalContent,
          settings: settingsRef.current,
        });
        dispatch({ type: 'markQueued', ids: [it.id], runToken: token, configVersion: version });
      }

      if (!poolRef.current) {
        const pool = new WorkerPool(concurrency);
        pool.onResult = ({ id, runToken, content, size }) => {
          dispatch({
            type: 'finish',
            id,
            runToken,
            content,
            size,
            configVersion: versionByToken.current.get(runToken) ?? version,
          });
        };
        pool.onError = ({ id, runToken, error }) => {
          dispatch({ type: 'fail', id, runToken, error });
        };
        poolRef.current = pool;
      }
      poolRef.current.enqueue(tasks);
    },
    [state.items, concurrency],
  );

  // Dispose the worker pool on unmount to free resources.
  useEffect(() => disposePool, [disposePool]);

  /** Cancel pending/optimizing items but keep completed results. */
  const cancel = useCallback(() => {
    const pendingIds = state.items
      .filter((it) => it.status === 'queued' || it.status === 'optimizing')
      .map((it) => it.id);
    poolRef.current?.cancel();
    poolRef.current = null;
    dispatch({ type: 'cancelPending', ids: pendingIds });
  }, [state.items]);

  const remove = useCallback((ids: string[]) => {
    dispatch({ type: 'remove', ids });
  }, []);

  const clear = useCallback(() => {
    poolRef.current?.cancel();
    poolRef.current = null;
    dispatch({ type: 'clear' });
  }, []);

  const retryFailed = useCallback(() => {
    const failed = state.items.filter((it) => it.status === 'failed').map((it) => it.id);
    if (failed.length) optimize(failed);
  }, [state.items, optimize]);

  const summary = useMemo(() => computeSummary(state.items), [state.items]);
  const successfulItems = useMemo(() => state.items.filter(isSuccessful), [state.items]);

  return {
    items: state.items,
    isRunning,
    summary,
    successfulItems,
    addFiles,
    optimize,
    cancel,
    remove,
    clear,
    retryFailed,
  };
}

export type QueueStatus = FileStatus;

