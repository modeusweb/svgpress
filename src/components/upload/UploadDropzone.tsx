'use client';

import { useCallback, useRef, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { MAX_FILE_BYTES, MAX_FILES } from '@/lib/files';

export function UploadDropzone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) onFiles(files);
    },
    [onFiles, disabled],
  );

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Drop SVG files here or press Enter to browse"
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors ${
        dragging
          ? 'border-accent bg-accent-soft'
          : 'border-line-strong bg-surface hover:border-accent/60 hover:bg-surface-2'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-ctl bg-surface-2 text-accent ring-1 ring-line">
        <ArrowUpTrayIcon className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="text-base font-semibold text-content">Drop your SVG files here</p>
      <p className="mt-1 text-sm text-muted">or browse files</p>

      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
          disabled={disabled}
        >
          Select SVG files
        </Button>
      </div>

      <p className="mt-4 text-xs text-subtle">
        Up to {MAX_FILES} files | {formatMb(MAX_FILE_BYTES)} each | .svg only
      </p>
      <p className="mt-1 text-xs text-subtle">
        Files are processed locally and never uploaded.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".svg,image/svg+xml"
        multiple
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}
