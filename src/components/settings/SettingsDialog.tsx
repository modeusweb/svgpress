'use client';

import type { AppPreferences, OptimizerSettings, PresetId, PreviewBackground } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SettingsPanel } from './SettingsPanel';

export function SettingsDialog({
  open,
  onClose,
  settings,
  preferences,
  onChangeSettings,
  onChangePreferences,
  onPresetChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  settings: OptimizerSettings;
  preferences: AppPreferences;
  onChangeSettings: (patch: Partial<OptimizerSettings>) => void;
  onChangePreferences: (patch: Partial<AppPreferences>) => void;
  onPresetChange: (preset: PresetId) => void;
  onReset: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Optimization settings"
      description="Changes apply the next time you optimize."
      size="lg"
    >
      <div className="mb-4 flex flex-wrap gap-4 rounded-panel border border-line bg-surface-2 p-3">
        <div>
          <label htmlFor="preview-bg" className="mb-1 block text-xs text-muted">
            Preview background
          </label>
          <select
            id="preview-bg"
            value={preferences.previewBackground}
            onChange={(e) =>
              onChangePreferences({ previewBackground: e.target.value as PreviewBackground })
            }
            className="h-9 rounded-ctl border border-line bg-surface px-3 text-sm text-content"
          >
            <option value="checker">Checkerboard</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label htmlFor="concurrency" className="mb-1 block text-xs text-muted">
            Parallel workers: {preferences.concurrency}
          </label>
          <input
            id="concurrency"
            type="range"
            min={1}
            max={8}
            value={preferences.concurrency}
            onChange={(e) => onChangePreferences({ concurrency: Number(e.target.value) })}
            className="mt-2 w-40 accent-[var(--accent)]"
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-content">
          <input
            type="checkbox"
            checked={preferences.autoDownloadOnFinish}
            onChange={(e) => onChangePreferences({ autoDownloadOnFinish: e.target.checked })}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Auto-download ZIP when batch finishes
        </label>
      </div>

      <SettingsPanel
        settings={settings}
        onChange={onChangeSettings}
        onPresetChange={onPresetChange}
        onReset={onReset}
      />

      <div className="mt-4 flex justify-end border-t border-line pt-4">
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
