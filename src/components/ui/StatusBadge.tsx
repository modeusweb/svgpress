import type { FileStatus } from '@/types';

type DotVariant = 'solid' | 'ring';

const STYLES: Record<
  FileStatus,
  { label: string; className: string; dot: string; variant: DotVariant }
> = {
  ready: {
    label: 'Ready',
    className: 'bg-surface-3 text-content',
    dot: 'border-current',
    variant: 'ring',
  },
  queued: {
    label: 'Queued',
    className: 'bg-info-soft text-info',
    dot: 'bg-info',
    variant: 'solid',
  },
  optimizing: {
    label: 'Optimizing',
    className: 'bg-warning-soft text-warning',
    dot: 'bg-warning',
    variant: 'solid',
  },
  optimized: {
    label: 'Optimized',
    className: 'bg-success-soft text-success',
    dot: 'bg-success',
    variant: 'solid',
  },
  no_savings: {
    label: 'No savings',
    className: 'bg-info-soft text-info',
    dot: 'bg-info',
    variant: 'solid',
  },
  failed: {
    label: 'Failed',
    className: 'bg-danger-soft text-danger',
    dot: 'bg-danger',
    variant: 'solid',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-surface-3 text-subtle',
    dot: 'bg-subtle',
    variant: 'solid',
  },
};

export function StatusBadge({ status }: { status: FileStatus }) {
  const s = STYLES[status];
  return (
    <span
      data-testid={`status-${status}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${s.className}`}
    >
      {s.variant === 'ring' ? (
        <span
          className={`h-2.5 w-2.5 rounded-full border-2 ${s.dot}`}
          aria-hidden="true"
        />
      ) : (
        <span
          className={`h-2 w-2 rounded-full ${s.dot} ${
            status === 'optimizing' ? 'animate-pulse' : ''
          }`}
          aria-hidden="true"
        />
      )}
      {s.label}
    </span>
  );
}

