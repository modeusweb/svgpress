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
    <th
      scope="col"
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`px-3 py-2.5 font-medium ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        className={`group inline-flex items-center gap-1 transition-colors hover:text-content ${
          active ? 'text-content' : 'text-muted'
        }`}
      >
        {label}
        <span
          aria-hidden="true"
          className={`inline-flex transition-all duration-150 ${
            active ? 'text-accent' : 'text-subtle opacity-0 group-hover:opacity-60'
          }`}
        >
          <svg
            viewBox="0 0 12 12"
            className={`h-3 w-3 transition-transform duration-150 ${
              active && dir === 'desc' ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7.5 6 4.5 9 7.5" />
          </svg>
        </span>
      </button>
    </th>
  );
}

