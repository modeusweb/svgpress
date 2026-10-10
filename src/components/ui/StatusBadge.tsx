import type { FileStatus } from '@/types';

const STYLES: Record<FileStatus, { label: string; className: string; dot: string }> = {
  ready: {
    label: 'Ready',
    className: 'bg-surface-3 text-muted',
    dot: 'bg-text-subtle',
  },
  queued: {
    label: 'Queued',
    className: 'bg-info-soft text-info',
    dot: 'bg-info',
  },
  optimizing: {
    label: 'Optimizing',
    className: 'bg-warning-soft text-warning',
    dot: 'bg-warning',
  },
  optimized: {
    label: 'Optimized',
    className: 'bg-success-soft text-success',
    dot: 'bg-success',
  },
  no_savings: {
    label: 'No savings',
    className: 'bg-info-soft text-info',
    dot: 'bg-info',
  },
  failed: {
    label: 'Failed',
    className: 'bg-danger-soft text-danger',
    dot: 'bg-danger',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-surface-3 text-subtle',
    dot: 'bg-text-subtle',
  },
};

export function StatusBadge({ status }: { status: FileStatus }) {
  const s = STYLES[status];
  return (
    <span
      data-testid={`status-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}
