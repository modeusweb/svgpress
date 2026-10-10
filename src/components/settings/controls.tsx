'use client';

import type { ReactNode } from 'react';

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  warning,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  warning?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-ctl px-3 py-2.5 hover:bg-surface-2/60">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-content">
          {label}
          {warning && (
            <span
              className="rounded bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-warning"
              title="May affect compatibility"
            >
              risky
            </span>
          )}
        </span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="block h-5 w-9 rounded-full bg-surface-3 transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ring)]" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-content transition-transform peer-checked:translate-x-4 peer-checked:bg-accent-fg" />
      </span>
    </label>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-line px-1 py-4 last:border-0">
      <h3 className="px-2 text-sm font-semibold text-content">{title}</h3>
      {description && <p className="mt-0.5 px-2 text-xs text-muted">{description}</p>}
      <div className="mt-2 flex flex-col">{children}</div>
    </section>
  );
}
