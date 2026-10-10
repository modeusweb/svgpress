import type { QueueItem } from '@/types';

/** Items that have a valid optimized result (optimized or no_savings). */
export function isSuccessful(it: QueueItem): boolean {
  return it.status === 'optimized' || it.status === 'no_savings';
}

export function isFailed(it: QueueItem): boolean {
  return it.status === 'failed';
}

export interface SummaryStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
}

/**
 * Compute aggregate statistics over the queue. Only successful items (with a
 * valid optimized size) contribute to the size math. Percentages are computed
 * from aggregate totals, never by summing per-file percentages.
 */
export function computeSummary(items: QueueItem[]): SummaryStats {
  const successful = items.filter(isSuccessful);
  const failed = items.filter(isFailed);
  const pending = items.filter(
    (it) => it.status === 'ready' || it.status === 'queued' || it.status === 'optimizing',
  ).length;

  const originalSize = successful.reduce((s, it) => s + it.originalSize, 0);
  const optimizedSize = successful.reduce((s, it) => s + (it.optimized?.size ?? 0), 0);
  const savedBytes = originalSize - optimizedSize;
  const savedPercent = originalSize > 0 ? (savedBytes / originalSize) * 100 : 0;

  return {
    total: items.length,
    successful: successful.length,
    failed: failed.length,
    pending,
    originalSize,
    optimizedSize,
    savedBytes,
    savedPercent,
  };
}

/** Sort helpers for the file table. */
export type SortKey = 'name' | 'originalSize' | 'savedBytes' | 'savedPercent' | 'status';
export type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<QueueItem['status'], number> = {
  optimizing: 0,
  queued: 1,
  ready: 2,
  optimized: 3,
  no_savings: 4,
  failed: 5,
  cancelled: 6,
};

export function sortItems(
  items: QueueItem[],
  key: SortKey,
  dir: SortDir,
): QueueItem[] {
  const factor = dir === 'asc' ? 1 : -1;
  const sorted = [...items].sort((a, b) => {
    switch (key) {
      case 'name':
        return a.originalName.localeCompare(b.originalName) * factor;
      case 'originalSize':
        return (a.originalSize - b.originalSize) * factor;
      case 'savedBytes':
        return ((a.savedBytes ?? 0) - (b.savedBytes ?? 0)) * factor;
      case 'savedPercent':
        return ((a.savedPercent ?? 0) - (b.savedPercent ?? 0)) * factor;
      case 'status':
        return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * factor;
      default:
        return 0;
    }
  });
  return sorted;
}

/** Filter items by a search string and status filter. */
export function filterItems(
  items: QueueItem[],
  search: string,
  statusFilter: QueueItem['status'] | 'all',
): QueueItem[] {
  const q = search.trim().toLowerCase();
  return items.filter((it) => {
    if (statusFilter !== 'all' && it.status !== statusFilter) return false;
    if (!q) return true;
    return it.originalName.toLowerCase().includes(q);
  });
}
