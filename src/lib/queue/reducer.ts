import type { FileStatus, QueueItem } from '@/types';
import { uid } from '@/lib/utils/format';

export interface QueueState {
  items: QueueItem[];
  /** Monotonic counter for run tokens, incremented per task dispatch. */
  runSeq: number;
}

export type QueueAction =
  | { type: 'add'; items: QueueItem[] }
  | { type: 'patch'; id: string; patch: Partial<QueueItem> }
  | { type: 'remove'; ids: string[] }
  | { type: 'clear' }
  | { type: 'markQueued'; ids: string[]; runToken: number; configVersion: string }
  | { type: 'markOptimizing'; id: string }
  | {
      type: 'finish';
      id: string;
      runToken: number;
      content: string;
      size: number;
      configVersion: string;
    }
  | { type: 'fail'; id: string; runToken: number; error: string }
  | { type: 'cancelPending'; ids: string[] }
  | { type: 'nextRunSeq' };

export const initialQueueState: QueueState = { items: [], runSeq: 0 };

export function queueReducer(state: QueueState, action: QueueAction): QueueState {
  switch (action.type) {
    case 'add':
      return { ...state, items: [...state.items, ...action.items] };

    case 'patch':
      return {
        ...state,
        items: state.items.map((it) => (it.id === action.id ? { ...it, ...action.patch } : it)),
      };

    case 'remove': {
      const set = new Set(action.ids);
      return { ...state, items: state.items.filter((it) => !set.has(it.id)) };
    }

    case 'clear':
      return { ...state, items: [] };

    case 'markQueued':
      return {
        ...state,
        items: state.items.map((it) =>
          action.ids.includes(it.id)
            ? {
                ...it,
                status: 'queued',
                runToken: action.runToken,
                error: undefined,
                configurationVersion: action.configVersion,
                optimized: undefined,
                savedBytes: undefined,
                savedPercent: undefined,
                startedAt: undefined,
                completedAt: undefined,
              }
            : it,
        ),
      };

    case 'markOptimizing':
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.id && it.status === 'queued'
            ? { ...it, status: 'optimizing', startedAt: Date.now() }
            : it,
        ),
      };

    case 'finish': {
      return {
        ...state,
        items: state.items.map((it) => {
          if (it.id !== action.id) return it;
          // Guard against stale results: ignore if a newer run has been queued.
          if (it.runToken !== undefined && it.runToken !== action.runToken) return it;
          const savedBytes = it.originalSize - action.size;
          const savedPercent =
            it.originalSize > 0 ? (savedBytes / it.originalSize) * 100 : 0;
          const status: FileStatus = savedBytes > 0 ? 'optimized' : 'no_savings';
          return {
            ...it,
            status,
            optimized: { content: action.content, size: action.size },
            savedBytes,
            savedPercent,
            completedAt: Date.now(),
            error: undefined,
            configurationVersion: action.configVersion,
          };
        }),
      };
    }

    case 'fail':
      return {
        ...state,
        items: state.items.map((it) => {
          if (it.id !== action.id) return it;
          if (it.runToken !== undefined && it.runToken !== action.runToken) return it;
          return {
            ...it,
            status: 'failed',
            error: action.error,
            completedAt: Date.now(),
            optimized: undefined,
            savedBytes: undefined,
            savedPercent: undefined,
          };
        }),
      };

    case 'cancelPending': {
      const set = new Set(action.ids);
      return {
        ...state,
        items: state.items.map((it) =>
          set.has(it.id) && (it.status === 'queued' || it.status === 'optimizing')
            ? { ...it, status: 'cancelled' }
            : it,
        ),
      };
    }

    case 'nextRunSeq':
      return { ...state, runSeq: state.runSeq + 1 };

    default:
      return state;
  }
}

export function makeId(): string {
  return uid('item');
}
