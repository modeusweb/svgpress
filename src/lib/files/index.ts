import type { AppPreferences, OptimizerSettings } from '@/types';

/** Byte length of a UTF-8 string. */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_FILES = 100; // max files per batch

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Validate a single SVG file before it enters the queue. We do not trust the
 * MIME type or extension alone - we also check that the decoded text actually
 * looks like an SVG document.
 */
export function validateSvgFile(file: { name: string; size: number }): ValidationResult {
  if (file.size === 0) {
    return { ok: false, reason: 'File is empty (0 bytes).' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: `File is larger than ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB.`,
    };
  }
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.svg') && !lower.endsWith('.svgz')) {
    return { ok: false, reason: 'Only .svg files are supported.' };
  }
  return { ok: true };
}

/**
 * Validate that the decoded text content actually represents an SVG document.
 * This is a lightweight sanity check, not a full parser.
 */
export function looksLikeSvg(text: string): boolean {
  const head = text.slice(0, 4096).toLowerCase();
  if (head.includes('<!doctype html') || head.includes('<html')) return false;
  return /<svg[\s>]/.test(head);
}

/**
 * Sanitize a file name for safe use as a download name and archive entry.
 * - Removes path separators and traversal segments.
 * - Strips control characters.
 * - Preserves Unicode letters, digits, spaces and common punctuation.
 */
export function sanitizeFileName(name: string): string {
  // Drop any directory components.
  const base = name.split(/[\\/]/).pop() ?? name;
  // Remove null bytes and control chars.
  let cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  // Disallow reserved-ish sequences but keep Unicode intact.
  cleaned = cleaned.replace(/\.\.+/g, '.');
  // Trim leading dots/spaces that could confuse filesystems.
  cleaned = cleaned.replace(/^[\s.]+/, '');
  if (!cleaned) cleaned = 'file';
  // Reasonable length cap (keep extension).
  if (cleaned.length > 120) {
    const dot = cleaned.lastIndexOf('.');
    const ext = dot > 0 ? cleaned.slice(dot) : '';
    cleaned = cleaned.slice(0, 120 - ext.length) + ext;
  }
  return cleaned;
}

/**
 * Build an output name from an original name. By default the original name is
 * kept as-is (no `_optimized` suffix); collisions are resolved with ` (n)` so
 * multiple files with the same name can coexist without overwriting.
 */
export function buildOutputName(
  originalName: string,
  taken: Set<string>,
  suffix = '',
): string {
  const sanitized = sanitizeFileName(originalName);
  const lower = sanitized.toLowerCase().endsWith('.svg') ? sanitized : `${sanitized}.svg`;
  const dot = lower.lastIndexOf('.');
  const stem = dot > 0 ? lower.slice(0, dot) : lower;
  let candidate = `${stem}${suffix}.svg`;

  let n = 2;
  while (taken.has(candidate.toLowerCase())) {
    candidate = `${stem}${suffix} (${n}).svg`;
    n += 1;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** MIME type for SVG downloads. */
export const SVG_MIME = 'image/svg+xml;charset=utf-8';

// -------- Local storage persistence (preferences & settings only) --------

const PREFS_KEY = 'svgpress:preferences';
const SETTINGS_KEY = 'svgpress:settings';

export function loadPreferences(): AppPreferences | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      theme: parsed.theme === 'light' || parsed.theme === 'system' ? parsed.theme : 'dark',
      previewBackground:
        parsed.previewBackground === 'dark' || parsed.previewBackground === 'light'
          ? parsed.previewBackground
          : 'checker',
      autoDownloadOnFinish: Boolean(parsed.autoDownloadOnFinish),
      concurrency:
        typeof parsed.concurrency === 'number' && parsed.concurrency >= 1 && parsed.concurrency <= 8
          ? parsed.concurrency
          : 2,
    };
  } catch {
    return null;
  }
}

export function savePreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function loadSettings(): OptimizerSettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OptimizerSettings;
  } catch {
    return null;
  }
}

export function saveSettings(settings: OptimizerSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
