/** Format a byte count as B / KB / MB with sensible precision. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${trim(kb, kb < 10 ? 2 : 1)} KB`;
  const mb = kb / 1024;
  return `${trim(mb, mb < 10 ? 2 : 1)} MB`;
}

function trim(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

/** Format a signed percentage with a fixed number of digits. */
export function formatPercent(percent: number, digits = 1): string {
  if (!Number.isFinite(percent)) return '-';
  const sign = percent > 0 ? '' : '';
  return `${sign}${percent.toFixed(digits)}%`;
}

/** Compute byte savings (original - optimized). */
export function computeSavedBytes(original: number, optimized: number): number {
  return original - optimized;
}

/** Compute percentage saved relative to the original. Returns 0 for zero-size originals. */
export function computeSavedPercent(original: number, optimized: number): number {
  if (original <= 0) return 0;
  return ((original - optimized) / original) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

let idCounter = 0;
/** Generate a unique-ish id without external dependencies. */
export function uid(prefix = 'id'): string {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${rand}`;
}
