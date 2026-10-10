'use client';

import { useMemo, useState } from 'react';
import type { FileStatus, QueueItem } from '@/types';
import { filterItems, sortItems, type SortDir, type SortKey } from '@/lib/queue/stats';
import { FileRow, Checkbox } from './FileRow';
import { SortableTh } from './SortableTh';

const STATUS_FILTERS: { value: FileStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'optimized', label: 'Optimized' },
  { value: 'no_savings', label: 'No savings' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function FileTable({
  items,
  onPreview,
  onDownload,
  onRemove,
  onRemoveMany,
  onToggleSelect,
  onToggleAll,
  onRetry,
  selectedIds,
}: {
  items: QueueItem[];
  onPreview: (item: QueueItem) => void;
  onDownload: (item: QueueItem) => void;
  onRemove: (id: string) => void;
  onRemoveMany: (ids: string[]) => void;
  onToggleSelect: (id: string) => void;
  onToggleAll: (select: boolean) => void;
  onRetry: (item: QueueItem) => void;
  selectedIds: Set<string>;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FileStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const visible = useMemo(
    () => sortItems(filterItems(items, search, statusFilter), sortKey, sortDir),
    [items, search, statusFilter, sortKey, sortDir],
  );

  const allVisibleSelected = visible.length > 0 && visible.every((it) => selectedIds.has(it.id));

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <section aria-label="File queue" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            aria-label="Search files by name"
            className="h-9 w-full rounded-ctl border border-line bg-surface-2 px-3 text-sm text-content placeholder:text-subtle focus:border-accent/60"
          />
        </div>
        <label className="sr-only" htmlFor="status-filter">
          Filter by status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as FileStatus | 'all')}
          className="h-9 rounded-ctl border border-line bg-surface-2 px-3 text-sm text-content"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <span className="text-xs text-muted tabular-nums whitespace-nowrap">
          {visible.length} of {items.length}
        </span>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={() => onRemoveMany(Array.from(selectedIds))}
            className="inline-flex h-9 items-center gap-1.5 rounded-ctl border border-danger/30 bg-danger-soft px-3 text-[13px] font-medium text-danger hover:bg-danger/20"
          >
            Delete {selectedIds.size} selected
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full text-left">
            <thead>
              <tr className="border-b border-line bg-surface-2/60 text-xs text-muted">
                <th className="w-10 pl-4 py-2.5">
                  <Checkbox
                    checked={allVisibleSelected}
                    onChange={() => onToggleAll(!allVisibleSelected)}
                    label="Select all files"
                  />
                </th>
                <SortableTh label="File" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
                <SortableTh label="Original" className="hidden sm:table-cell" active={sortKey === 'originalSize'} dir={sortDir} onClick={() => toggleSort('originalSize')} />
                <SortableTh label="Optimized" className="hidden md:table-cell" active={false} dir={sortDir} onClick={() => {}} />
                <SortableTh label="Saved" className="hidden lg:table-cell" active={sortKey === 'savedBytes'} dir={sortDir} onClick={() => toggleSort('savedBytes')} />
                <SortableTh label="%" className="hidden lg:table-cell" active={sortKey === 'savedPercent'} dir={sortDir} onClick={() => toggleSort('savedPercent')} />
                <SortableTh label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
                <th className="pr-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <FileRow
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={onToggleSelect}
                  onPreview={onPreview}
                  onDownload={onDownload}
                  onRemove={onRemove}
                  onRetry={onRetry}
                />
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No files match the current filters.
          </p>
        )}
      </div>
    </section>
  );
}
