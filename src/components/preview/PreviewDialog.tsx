'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PreviewBackground, QueueItem } from '@/types';
import { formatBytes } from '@/lib/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { SVG_MIME } from '@/lib/files';
import { TabButton, MetaStat, CodeView } from './preview-parts';

type View = 'original' | 'optimized';

const BG_CLASSES: Record<PreviewBackground, string> = {
  checker: 'checkerboard',
  dark: 'bg-[#0b0d10]',
  light: 'bg-white',
};

export function PreviewDialog({
  item,
  open,
  onClose,
  background,
  onDownload,
}: {
  item: QueueItem | null;
  open: boolean;
  onClose: () => void;
  background: PreviewBackground;
  onDownload: (item: QueueItem) => void;
}) {
  const [view, setView] = useState<View>('optimized');
  const [showCode, setShowCode] = useState(false);
  const { push } = useToast();


  const hasResult = item?.status === 'optimized' || item?.status === 'no_savings';
  const currentContent =
    view === 'optimized' && item?.optimized ? item.optimized.content : item?.originalContent ?? '';
  const currentSize =
    view === 'optimized' && item?.optimized ? item.optimized.size : item?.originalSize ?? 0;

  const imgUrl = useMemo(() => {
    if (!currentContent) return null;
    const blob = new Blob([currentContent], { type: 'image/svg+xml;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [currentContent]);

  useEffect(() => {
    return () => {
      if (imgUrl) URL.revokeObjectURL(imgUrl);
    };
  }, [imgUrl]);

  if (!item) return null;

  const copyCode = async () => {
    if (!item.optimized) return;
    try {
      await navigator.clipboard.writeText(item.optimized.content);
      push({ kind: 'success', title: 'Optimized SVG copied to clipboard' });
    } catch {
      push({ kind: 'error', title: 'Could not copy to clipboard' });
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.originalName}
      description={
        hasResult && item.optimized
          ? `${formatBytes(item.originalSize)} to ${formatBytes(item.optimized.size)}`
          : `Original size ${formatBytes(item.originalSize)}`
      }
      size="lg"
      footer={
        <>
          <span className="mr-auto text-xs text-muted">
            Preview is sandboxed - scripts and external references never execute.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setShowCode((s) => !s)}>
            {showCode ? 'Show image' : 'Show code'}
          </Button>
          <Button variant="primary" size="sm" onClick={copyCode} disabled={!item.optimized}>
            Copy code
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onDownload(item)} disabled={!hasResult}>
            Download
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="inline-flex rounded-ctl border border-line bg-surface-2 p-0.5">
          <TabButton active={view === 'original'} onClick={() => setView('original')} label="Original" />
          <TabButton
            active={view === 'optimized'}
            onClick={() => setView('optimized')}
            label="Optimized"
            disabled={!hasResult}
          />
        </div>
        {!hasResult && <span className="text-xs text-muted">No optimized result available yet.</span>}
        {item.error && (
          <span className="text-xs text-danger" role="alert">
            {item.error}
          </span>
        )}
      </div>

      {showCode ? (
        <CodeView content={currentContent} />
      ) : (
        <div
          className={`flex min-h-[320px] items-center justify-center overflow-auto rounded-panel border border-line p-6 ${BG_CLASSES[background]}`}
        >
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={`${view} preview of ${item.originalName}`}
              className="max-h-[52vh] max-w-full object-contain"
            />
          ) : (
            <p className="text-sm text-muted">Nothing to preview.</p>
          )}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetaStat label="Version" value={view === 'optimized' ? 'Optimized' : 'Original'} />
        <MetaStat label="Size" value={formatBytes(currentSize)} />
        <MetaStat
          label="Saved"
          value={
            hasResult && item.savedBytes !== undefined
              ? `${formatBytes(Math.abs(item.savedBytes))}${item.savedBytes < 0 ? ' more' : ''}`
              : '-'
          }
        />
        <MetaStat label="Format" value={SVG_MIME.split(';')[0]} />
      </dl>
    </Modal>
  );
}
