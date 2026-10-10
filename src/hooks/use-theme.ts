'use client';

import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

const THEME_KEY = 'svgpress:theme';

/** Read the raw stored theme value (before React hydration). */
export function readStoredTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* ignore */
  }
  return 'dark';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveApplied(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return mode;
}

export function useTheme() {
  // Initialize lazily from storage on the client (SSR has no localStorage and
  // falls back to dark). This avoids setState-in-effect. The inline script in
  // layout.tsx already applied the correct theme before paint, and <html> uses
  // suppressHydrationWarning, so there is no flash or mismatch.
  const [mode, setMode] = useState<ThemeMode>(() =>
    typeof window === 'undefined' ? 'dark' : readStoredTheme(),
  );

  const applied = resolveApplied(mode);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', applied);
    root.style.colorScheme = applied;
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode, applied]);

  // React to OS-level theme changes when in "system" mode.
  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const root = document.documentElement;
      root.setAttribute('data-theme', resolveApplied('system'));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const setThemeMode = useCallback((next: ThemeMode) => setMode(next), []);

  return { mode, applied, setThemeMode };
}
