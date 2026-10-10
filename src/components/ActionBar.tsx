'use client';

import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Button';

export function ActionBar({
  total,
  readyCount,
  successfulCount,
  failedCount,
  isRunning,
  zipping,
  onOptimize,
  onCancel,
  onDownloadZip,
  onClear,
}: {
  total: number;
  readyCount: number;
  successfulCount: number;
  failedCount: number;
  isRunning: boolean;
  zipping: boolean;
  onOptimize: () => void;
  onCancel: () => void;
  onDownloadZip: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isRunning ? (
        <Button variant="secondary" onClick={onCancel} icon={<Spinner />}>
          Cancel
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={onOptimize}
          disabled={readyCount === 0}
          data-testid="optimize-all"
        >
          Optimize all
          {readyCount > 0 && (
            <span className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[11px] tabular-nums">
              {readyCount}
            </span>
          )}
        </Button>
      )}

      <Button
        variant="secondary"
        onClick={onDownloadZip}
        disabled={successfulCount === 0 || zipping}
        loading={zipping}
        data-testid="download-zip"
      >
        Download all (.zip)
        {successfulCount > 0 && (
          <span className="ml-1 text-muted tabular-nums">({successfulCount})</span>
        )}
      </Button>

      <div className="ml-auto flex items-center gap-3">
        {failedCount > 0 && !isRunning && (
          <span className="text-xs text-danger tabular-nums">{failedCount} failed</span>
        )}
        <Button variant="ghost" onClick={onClear} disabled={total === 0} data-testid="clear-all">
          Clear all
        </Button>
      </div>
    </div>
  );
}
