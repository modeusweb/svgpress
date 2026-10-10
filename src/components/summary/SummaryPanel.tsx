import type { SummaryStats } from '@/lib/queue/stats';
import { formatBytes, formatPercent } from '@/lib/utils/format';

export function SummaryPanel({ stats }: { stats: SummaryStats }) {
  const saved = stats.savedBytes;
  const positive = saved > 0;
  const negative = saved < 0;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Total files" value={String(stats.total)} />
      <Stat
        label="Optimized"
        value={String(stats.successful)}
        tone={stats.successful > 0 ? 'success' : undefined}
      />
      <Stat label="Failed" value={String(stats.failed)} tone={stats.failed > 0 ? 'danger' : undefined} />
      <Stat label="Original size" value={formatBytes(stats.originalSize)} />
      <Stat label="Optimized size" value={formatBytes(stats.optimizedSize)} />
      <div className="bg-surface px-4 py-3">
        <p className="text-xs text-muted">Total saved</p>
        <p
          className={`mt-1 text-lg font-semibold tabular-nums ${
            positive ? 'text-success' : negative ? 'text-danger' : 'text-content'
          }`}
        >
          {formatBytes(Math.abs(saved))}
        </p>
        <p
          className={`text-xs tabular-nums ${
            positive ? 'text-success' : negative ? 'text-danger' : 'text-muted'
          }`}
        >
          {negative ? '+' : ''}
          {formatPercent(saved >= 0 ? stats.savedPercent : Math.abs(stats.savedPercent))}
          {negative ? ' larger' : ''}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'danger';
}) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-content';
  return (
    <div className="bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}
