'use client';

import { useCallback, useState } from 'react';
import type { QueueItem } from '@/types';
import { SVG_MIME } from '@/lib/files';
import { createZip, downloadBlob, ZIP_NAME, type ZipEntry } from '@/lib/zip';
import { isSuccessful } from '@/lib/queue/stats';
import { useToast } from '@/hooks/use-toast';

/** Download a single optimized file as an SVG blob. */
export function useDownloadOne() {
  const { push } = useToast();
  return useCallback(
    (item: QueueItem) => {
      if (!item.optimized) {
        push({ kind: 'error', title: 'No optimized result to download', description: item.originalName });
        return;
      }
      try {
        const blob = new Blob([item.optimized.content], { type: SVG_MIME });
        downloadBlob(blob, item.outputName);
      } catch {
        push({ kind: 'error', title: 'Download failed', description: item.originalName });
      }
    },
    [push],
  );
}

/** Build a ZIP of all successful results with progress tracking. */
export function useDownloadZip() {
  const { push } = useToast();
  const [zipping, setZipping] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const run = useCallback(
    async (items: QueueItem[]) => {
      const successful = items.filter(isSuccessful);
      if (successful.length === 0) {
        push({ kind: 'warning', title: 'No optimized files to archive' });
        return;
      }
      if (zipping) return; // guard against re-entry
      setZipping(true);
      setProgress({ done: 0, total: successful.length });
      try {
        const entries: ZipEntry[] = successful.map((it) => ({
          name: it.outputName,
          content: it.optimized?.content ?? '',
        }));
        const blob = await createZip(entries, (p) => setProgress({ done: p.done, total: p.total }));
        downloadBlob(blob, ZIP_NAME);
        const skipped = items.length - successful.length;
        push({
          kind: 'success',
          title: `ZIP with ${successful.length} file${successful.length === 1 ? '' : 's'} downloaded`,
          description: skipped > 0 ? `${skipped} file(s) skipped (no valid result).` : undefined,
        });
      } catch (err) {
        push({
          kind: 'error',
          title: 'Could not create archive',
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setZipping(false);
        setProgress(null);
      }
    },
    [push, zipping],
  );

  return { run, zipping, progress };
}
