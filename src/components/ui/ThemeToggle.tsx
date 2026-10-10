'use client';

import type { ThemeMode } from '@/hooks/use-theme';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'system', label: 'System', Icon: ComputerDesktopIcon },
];

export function ThemeToggle({
  mode,
  onChange,
}: {
  mode: ThemeMode;
  onChange: (m: ThemeMode) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="flex items-center gap-0.5 rounded-ctl border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => onChange(value)}
            className={`rounded-[7px] p-1.5 transition-colors ${
              active ? 'bg-surface-3 text-content' : 'text-muted hover:text-content'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
