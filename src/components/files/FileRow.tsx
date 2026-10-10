'use client';

import { useMemo } from 'react';
import type { QueueItem } from '@/types';
import { formatBytes, formatPercent } from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowPathIcon,
  DownloadIcon,
  EyeIcon,
  Spinner,
  TrashIcon,
  Checkbox,
  SvgThumb,
  IconButton,
  truncate,
} from './row-parts';

export { Checkbox };

export function FileRow({
  item,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onRemove,
  onRetry,
}: {
  item: QueueItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (item: QueueItem) => void;
  onDownload: (item: QueueItem) => void;
  onRemove: (id: string) => void;
  onRetry: (item: QueueItem) => void;
}) {
  const hasResult = item.status === 'optimized' || item.status === 'no_savings';
  const isActive = item.status === 'queued' || item.status === 'optimizing';

  const savedTone = useMemo(() => {
    if (item.savedBytes === undefined) return 'text-muted';
    if (item.savedBytes > 0) return 'text-success';
    if (item.savedBytes < 0) return 'text-danger';
    return 'text-muted';
  }, [item.savedBytes]);

  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface-2/50">
      <td className="w-10 pl-4">
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          label={`Select ${item.originalName}`}
        />
      </td>

      <td className="py-3 pr-3">
        <div className="flex items-center gap-3 min-w-0">
          <SvgThumb content={item.originalContent} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-content" title={item.originalName}>
              {item.originalName}
            </p>
            <p className="text-xs text-subtle sm:hidden">{formatBytes(item.originalSize)}</p>
          </div>
        </div>
      </td>

      <td className="hidden px-3 text-sm tabular-nums text-muted sm:table-cell">
        {formatBytes(item.originalSize)}
      </td>

      <td className="hidden px-3 text-sm tabular-nums text-content md:table-cell">
        {hasResult && item.optimized ? formatBytes(item.optimized.size) : '-'}
      </td>

      <td className="hidden px-3 text-sm tabular-nums lg:table-cell">
        {item.savedBytes !== undefined ? (
          <span className={savedTone}>
            {item.savedBytes >= 0 ? formatBytes(item.savedBytes) : `+${formatBytes(-item.savedBytes)}`}
          </span>
        ) : (
          <span className="text-subtle">-</span>
        )}
      </td>

      <td className="hidden px-3 text-sm tabular-nums lg:table-cell">
        {item.savedPercent !== undefined ? (
          <span className={savedTone}>
            {formatPercent(item.savedPercent < 0 ? -item.savedPercent : item.savedPercent)}
            {item.savedPercent < 0 ? ' more' : ''}
          </span>
        ) : (
          <span className="text-subtle">-</span>
        )}
      </td>

      <td className="px-3">
        {isActive ? (
          <span className="inline-flex items-center gap-2 text-xs text-warning">
            <Spinner />
            {item.status === 'optimizing' ? 'Optimizing' : 'Queued'}
          </span>
        ) : item.status === 'failed' ? (
          <div className="flex flex-col gap-0.5">
            <StatusBadge status={item.status} />
            {item.error && (
              <span className="text-[11px] text-danger" title={item.error}>
                {truncate(item.error, 40)}
              </span>
            )}
          </div>
        ) : (
          <StatusBadge status={item.status} />
        )}
      </td>

      <td className="pr-4">
        <div className="flex items-center justify-end gap-0.5">
          <IconButton label={`Preview ${item.originalName}`} onClick={() => onPreview(item)}>
            <EyeIcon />
          </IconButton>
          <IconButton
            label={`Download ${item.originalName}`}
            onClick={() => onDownload(item)}
            disabled={!hasResult}
          >
            <DownloadIcon />
          </IconButton>
          {item.status === 'failed' && (
            <IconButton label={`Retry ${item.originalName}`} onClick={() => onRetry(item)}>
              <ArrowPathIcon />
            </IconButton>
          )}
          <IconButton label={`Remove ${item.originalName}`} onClick={() => onRemove(item.id)}>
            <TrashIcon />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}
