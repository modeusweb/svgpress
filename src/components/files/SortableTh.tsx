'use client';

import type { SortDir } from '@/lib/queue/stats';

export function SortableTh({
  label,
  active,
  dir,
  onClick,
  className = '',
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2.5 font-medium ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-content ${active ? 'text-content' : ''}`}
      >
        {label}
        {active && (
          <span aria-hidden="true" className="text-[10px]">
            {dir === 'asc' ? '^' : 'v'}
          </span>
        )}
      </button>
    </th>
  );
}
