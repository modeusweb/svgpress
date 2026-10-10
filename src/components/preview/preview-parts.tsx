'use client';

export function TabButton({
  active,
  onClick,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[7px] px-3 py-1 text-[13px] font-medium transition-colors disabled:opacity-40 ${
        active ? 'bg-surface-3 text-content' : 'text-muted hover:text-content'
      }`}
    >
      {label}
    </button>
  );
}

export function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-ctl border border-line bg-surface-2 px-3 py-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-content tabular-nums truncate">{value}</dd>
    </div>
  );
}

export function CodeView({ content }: { content: string }) {
  return (
    <pre className="max-h-[52vh] overflow-auto rounded-panel border border-line bg-[#0b0d10] p-4 text-[12px] leading-relaxed text-content font-mono whitespace-pre-wrap break-all">
      <code>{content}</code>
    </pre>
  );
}
