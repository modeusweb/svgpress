'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppPreferences, OptimizerSettings, PresetId, QueueItem } from '@/types';
import { useQueue } from '@/hooks/use-queue';
import { useDownloadOne, useDownloadZip } from '@/hooks/use-download';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_SETTINGS, PRESETS } from '@/lib/svgo/config';
import { loadPreferences, loadSettings, savePreferences, saveSettings, MAX_FILES } from '@/lib/files';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { FileTable } from '@/components/files/FileTable';
import { SummaryPanel } from '@/components/summary/SummaryPanel';
import { ActionBar } from '@/components/ActionBar';
import { PreviewDialog } from '@/components/preview/PreviewDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Header } from '@/components/Header';
import { HelpDialog } from '@/components/HelpDialog';
import { ToastViewport } from '@/components/ui/ToastViewport';

export function OptimizerClient() {
  const { push } = useToast();
  const { mode: themeMode, setThemeMode } = useTheme();

  const [preferences, setPreferences] = useState<AppPreferences>(() => ({
    theme: 'dark',
    previewBackground: 'checker',
    autoDownloadOnFinish: false,
    concurrency: 2,
    ...(loadPreferences() ?? {}),
  }));

  const [settings, setSettings] = useState<OptimizerSettings>(
    () => loadSettings() ?? DEFAULT_SETTINGS,
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const queue = useQueue({ settings, concurrency: preferences.concurrency });
  const downloadOne = useDownloadOne();
  const { run: downloadZip, zipping } = useDownloadZip();

  useEffect(() => savePreferences(preferences), [preferences]);
  useEffect(() => saveSettings(settings), [settings]);

  const livePreview = useMemo(
    () => queue.items.find((it) => it.id === previewItem?.id) ?? previewItem,
    [queue.items, previewItem],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      const remaining = MAX_FILES - queue.items.length;
      if (remaining <= 0) {
        push({ kind: 'warning', title: `Batch limit reached (${MAX_FILES} files)` });
        return;
      }
      const slice = files.slice(0, remaining);
      if (files.length > remaining) {
        push({ kind: 'warning', title: `Only ${remaining} more file(s) can be added.` });
      }
      const { added, rejected } = await queue.addFiles(slice);
      if (added > 0) {
        push({ kind: 'success', title: `Added ${added} file${added === 1 ? '' : 's'}` });
      }
      if (rejected.length > 0) {
        const first = rejected[0];
        push({
          kind: 'error',
          title: `${rejected.length} file${rejected.length === 1 ? '' : 's'} rejected`,
          description: `${first.name}: ${first.reason}`,
        });
      }
    },
    [queue, push],
  );

  const onPresetChange = useCallback((preset: PresetId) => {
    if (preset === 'custom') return;
    const p = PRESETS[preset];
    setSettings((s) => ({ ...s, ...p.defaults }));
  }, []);

  const onChangeSettings = useCallback((patch: Partial<OptimizerSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      const match = Object.values(PRESETS).find((p) =>
        (Object.keys(p.defaults) as (keyof OptimizerSettings)[]).every(
          (k) => next[k] === p.defaults[k],
        ),
      );
      next.preset = match ? match.id : 'custom';
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (select: boolean) => {
      setSelectedIds(select ? new Set(queue.items.map((i) => i.id)) : new Set());
    },
    [queue.items],
  );

  const readyCount = queue.items.filter((i) => i.status === 'ready').length;

  // Announce batch completion via toast once, when it transitions to done.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (queue.isRunning) wasRunning.current = true;
    if (!queue.isRunning && wasRunning.current) {
      wasRunning.current = false;
      if (queue.summary.successful > 0) {
        push({
          kind: 'success',
          title: `Optimized ${queue.summary.successful} file${queue.summary.successful === 1 ? '' : 's'}`,
          description: queue.summary.savedBytes > 0
            ? `Saved ${queue.summary.savedBytes} bytes total.`
            : undefined,
        });
      }
    }
  }, [queue.isRunning, queue.summary.successful, queue.summary.savedBytes, push]);

  return (
    <>
      <Header
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Optimize SVGs in bulk
          </h1>
          <p className="mt-1 text-sm text-muted">Smaller SVGs. Cleaner markup. One workflow.</p>
        </div>

        {queue.items.length > 0 && (
          <div className="mb-6 flex flex-col gap-4">
            <SummaryPanel stats={queue.summary} />
            <ActionBar
              total={queue.items.length}
              readyCount={readyCount}
              successfulCount={queue.summary.successful}
              failedCount={queue.summary.failed}
              isRunning={queue.isRunning}
              zipping={zipping}
              onOptimize={() => queue.optimize()}
              onCancel={queue.cancel}
              onDownloadZip={() => downloadZip(queue.items)}
              onClear={() => setClearOpen(true)}
            />
          </div>
        )}

        <div className="mb-6">
          <UploadDropzone onFiles={handleFiles} disabled={queue.isRunning} />
        </div>

        {queue.items.length > 0 && (
          <FileTable
            items={queue.items}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            onPreview={(item) => setPreviewItem(item)}
            onDownload={downloadOne}
            onRemove={(id) => queue.remove([id])}
            onRemoveMany={(ids) => {
              queue.remove(ids);
              setSelectedIds(new Set());
            }}
            onRetry={(item) => queue.optimize([item.id])}
          />
        )}

        {queue.items.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-sm text-subtle">No files yet. Add SVGs above to get started.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-line py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-subtle sm:px-6">
          SVGPress processes everything locally in your browser. Files are never uploaded.
        </div>
      </footer>

      <PreviewDialog
        key={previewItem?.id ?? 'closed'}
        item={livePreview}
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
        background={preferences.previewBackground}
        onDownload={downloadOne}
      />

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        preferences={preferences}
        onChangeSettings={onChangeSettings}
        onChangePreferences={(patch) => setPreferences((p) => ({ ...p, ...patch }))}
        onPresetChange={onPresetChange}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
      />

      <ConfirmDialog
        open={clearOpen}
        title="Clear all files?"
        message={
          queue.summary.successful > 0
            ? `This will remove ${queue.items.length} file(s), including ${queue.summary.successful} optimized result(s). This cannot be undone.`
            : `This will remove ${queue.items.length} file(s).`
        }
        confirmLabel="Clear all"
        onConfirm={() => {
          queue.clear();
          setSelectedIds(new Set());
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ToastViewport />
    </>
  );
}


