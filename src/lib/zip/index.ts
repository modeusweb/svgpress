import JSZip from 'jszip';

export interface ZipEntry {
  name: string;
  content: string;
}

export interface ZipProgress {
  done: number;
  total: number;
}

/**
 * Build a ZIP Blob from the given entries. Only successful, optimized files
 * should be passed here. Names are already sanitized / de-duplicated upstream.
 */
export async function createZip(
  entries: ZipEntry[],
  onProgress?: (p: ZipProgress) => void,
): Promise<Blob> {
  if (entries.length === 0) {
    throw new Error('No files to archive.');
  }
  const zip = new JSZip();

  const used = new Set<string>();
  let done = 0;
  for (const entry of entries) {
    // Guard against path traversal / absolute paths in entry names. Files go
    // straight into the archive root - no extra nesting folder.
    const safeName = sanitizeEntryName(entry.name, used);
    zip.file(safeName, entry.content, { binary: false });
    done += 1;
    onProgress?.({ done, total: entries.length });
  }

  return zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => {
      // JSZip reports its own internal progress; combine with entry count.
      onProgress?.({ done: Math.round(meta.percent), total: entries.length });
    },
  );
}

/** Ensure an archive entry name is safe and unique within the archive. */
export function sanitizeEntryName(name: string, used: Set<string>): string {
  // Strip any directory components and leading separators.
  const base = name.split(/[\\/]/).filter(Boolean).pop() ?? 'file.svg';
  let cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (!cleaned) cleaned = 'file.svg';
  const lower = cleaned.toLowerCase().endsWith('.svg') ? cleaned : `${cleaned}.svg`;

  let candidate = lower;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const dot = lower.lastIndexOf('.');
    const stem = dot > 0 ? lower.slice(0, dot) : lower;
    const ext = dot > 0 ? lower.slice(dot) : '.svg';
    candidate = `${stem} (${n})${ext}`;
    n += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

export const ZIP_NAME = 'svgpress-optimized.zip';

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on next tick to allow the download to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
