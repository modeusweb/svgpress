'use client';

import type { ThemeMode } from '@/hooks/use-theme';
import Link from 'next/link';
import { CpuChipIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Header({
  themeMode,
  onThemeChange,
  onOpenSettings,
  onOpenHelp,
}: {
  themeMode: ThemeMode;
  onThemeChange: (m: ThemeMode) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="SVGPress home">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight text-content">SVGPress</span>
        </Link>

        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs text-muted sm:inline-flex">
          <CpuChipIcon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          Runs locally in your browser
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenHelp}
            className="inline-flex items-center gap-1.5 rounded-ctl px-2.5 py-1.5 text-[13px] text-muted hover:bg-surface-2 hover:text-content"
          >
            <QuestionMarkCircleIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Help</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 rounded-ctl border border-line bg-surface-2 px-3 py-1.5 text-[13px] font-medium text-content hover:border-line-strong hover:bg-surface-3"
          >
            Settings
          </button>
          <ThemeToggle mode={themeMode} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  );
}

export function Logo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" role="img">
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--surface-2)" stroke="var(--border-strong)" />
      <path
        d="M9 21.5 16 10l7 11.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.2 18h7.6" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
