'use client';

import { useRef } from 'react';
import type { OptimizerSettings, PresetId } from '@/types';
import { PRESET_LIST, settingsMatchPreset } from '@/lib/svgo/config';
import { validateCustomConfig } from '@/lib/svgo/validate';
import { Toggle, Section } from './controls';

type Key = keyof OptimizerSettings;

interface ToggleSpec {
  key: Key;
  label: string;
  hint?: string;
  warning?: boolean;
}

const CLEANUP: ToggleSpec[] = [
  { key: 'removeComments', label: 'Remove comments', hint: 'Strip HTML/XML comments.' },
  { key: 'keepLicenseComments', label: 'Keep license comments', hint: 'Preserve license text.' },
  { key: 'removeMetadata', label: 'Remove metadata', hint: 'Drop metadata, title and desc.' },
  { key: 'removeEditorData', label: 'Remove editor data', hint: 'Drop editor namespaces/attrs.' },
  { key: 'removeUselessDefs', label: 'Remove unused defs', hint: 'Delete unreferenced defs.' },
  { key: 'removeHiddenElems', label: 'Remove hidden elements', hint: 'Delete zero-size/display:none.' },
];

const STRUCTURE: ToggleSpec[] = [
  { key: 'collapseGroups', label: 'Collapse redundant groups' },
  { key: 'convertTransform', label: 'Optimize transforms' },
  { key: 'convertPathData', label: 'Clean up path data', hint: 'Shorten path commands.' },
  { key: 'convertShapeToPath', label: 'Convert shapes to paths', warning: true },
  { key: 'mergePaths', label: 'Merge paths', warning: true },
];

const NUMBERS: ToggleSpec[] = [
  { key: 'cleanupNumericValues', label: 'Clean numeric values' },
  { key: 'minifyStyles', label: 'Minify inline styles' },
  { key: 'removeUnknownsAndDefaults', label: 'Remove unknowns and defaults' },
];

const IDENTIFIERS: ToggleSpec[] = [
  { key: 'cleanupIds', label: 'Minify/clean IDs', warning: true, hint: 'May break external url(#id).' },
  { key: 'removeViewBox', label: 'Remove viewBox', warning: true, hint: 'Off by default. Breaks scaling.' },
  { key: 'removeXMLProcInst', label: 'Remove XML declaration', hint: 'Drops the XML prolog.' },
];

const ALLOWED_KEYS: Key[] = [
  'preset', 'removeComments', 'removeMetadata', 'removeEditorData', 'removeUselessDefs',
  'removeHiddenElems', 'removeViewBox', 'cleanupIds', 'convertPathData', 'convertShapeToPath',
  'mergePaths', 'collapseGroups', 'convertTransform', 'minifyStyles', 'cleanupNumericValues',
  'floatPrecision', 'removeUnknownsAndDefaults', 'keepLicenseComments', 'removeXMLDeclaration',
  'removeXMLProcInst', 'customConfig',
];

export function SettingsPanel({
  settings,
  onChange,
  onPresetChange,
  onReset,
}: {
  settings: OptimizerSettings;
  onChange: (patch: Partial<OptimizerSettings>) => void;
  onPresetChange: (preset: PresetId) => void;
  onReset: () => void;
}) {
  const set = <K extends Key>(key: K, value: OptimizerSettings[K]) =>
    onChange({ [key]: value } as Partial<OptimizerSettings>);

  const customError = settings.customConfig
    ? validateCustomConfig(settings.customConfig).error
    : undefined;
  const importRef = useRef<HTMLInputElement>(null);

  const renderToggles = (specs: ToggleSpec[]) =>
    specs.map((s) => (
      <Toggle
        key={s.key}
        checked={Boolean(settings[s.key])}
        onChange={(v) => set(s.key, v as OptimizerSettings[typeof s.key])}
        label={s.label}
        hint={s.hint}
        warning={s.warning}
      />
    ));

  return (
    <div className="flex flex-col">
      <Section title="Preset" description="Quick starting points for common needs.">
        <div className="grid grid-cols-1 gap-2 px-2 sm:grid-cols-3">
          {PRESET_LIST.map((p) => {
            const active = settings.preset === p.id && settingsMatchPreset(settings, p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                aria-pressed={active}
                className={`rounded-panel border p-3 text-left transition-colors ${
                  active ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:border-line-strong'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-content">{p.name}</span>
                  <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">{p.tagline}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{p.detail}</p>
              </button>
            );
          })}
        </div>
        {settings.preset !== 'custom' && !settingsMatchPreset(settings, settings.preset) && (
          <p className="mt-2 px-2 text-xs text-warning">
            Modified from the {settings.preset} preset - preset is now Custom.
          </p>
        )}
      </Section>

      <Section title="Cleanup" description="Remove noise without changing rendering.">
        {renderToggles(CLEANUP)}
      </Section>

      <Section title="Structure and geometry">
        {renderToggles(STRUCTURE)}
      </Section>

      <Section title="Numbers and styles">
        {renderToggles(NUMBERS)}
        <div className="mt-2 px-2">
          <label htmlFor="precision" className="flex items-center justify-between text-sm font-medium text-content">
            Float precision
            <span className="text-xs tabular-nums text-muted">{settings.floatPrecision} digits</span>
          </label>
          <input
            id="precision"
            type="range"
            min={0}
            max={8}
            step={1}
            value={settings.floatPrecision}
            onChange={(e) => set('floatPrecision', Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
          <p className="mt-1 text-xs text-muted">Lower is smaller but less precise. 2-3 is a good balance.</p>
        </div>
      </Section>

      <Section title="Identifiers and XML" description="Handle IDs carefully if referenced externally.">
        {renderToggles(IDENTIFIERS)}
      </Section>

      <Section title="Advanced" description="Merge extra SVGO plugins via JSON (names and params only, no code).">
        <div className="px-2">
          <label htmlFor="custom-config" className="text-sm font-medium text-content">
            Custom plugin config (JSON)
          </label>
          <textarea
            id="custom-config"
            value={settings.customConfig ?? ''}
            onChange={(e) => set('customConfig', e.target.value)}
            placeholder='{ "plugins": [{ "name": "prefixIds", "params": { "prefix": "x" } }] }'
            rows={4}
            className={`mt-2 w-full rounded-ctl border bg-surface-2 p-2.5 font-mono text-[12px] text-content placeholder:text-subtle focus:border-accent/60 ${
              customError ? 'border-danger' : 'border-line'
            }`}
          />
          {customError ? (
            <p className="mt-1 text-xs text-danger" role="alert">{customError}</p>
          ) : (
            <p className="mt-1 text-xs text-muted">Extra plugins merge on top of the above. Functions are not allowed.</p>
          )}
        </div>
      </Section>

      <div className="flex items-center gap-2 px-2 pt-2">
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="rounded-ctl border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-content hover:border-line-strong"
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={() => exportSettings(settings)}
          className="rounded-ctl border border-line bg-surface-2 px-3 py-1.5 text-[13px] text-content hover:border-line-strong"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={onReset}
          className="ml-auto rounded-ctl px-3 py-1.5 text-[13px] text-muted hover:text-content"
        >
          Reset to defaults
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => importSettings(e, onChange)}
        />
      </div>
    </div>
  );
}

function exportSettings(settings: OptimizerSettings): void {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'svgpress-settings.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importSettings(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (patch: Partial<OptimizerSettings>) => void,
): void {
  const file = e.target.files?.[0];
  if (!file) return;
  void file.text().then((text) => {
    try {
      const parsed = JSON.parse(text) as Partial<OptimizerSettings>;
      const patch: Partial<OptimizerSettings> = {};
      for (const key of ALLOWED_KEYS) {
        if (key in parsed) (patch as Record<string, unknown>)[key] = parsed[key];
      }
      onChange(patch);
    } catch {
      onChange({});
    }
  });
  e.target.value = '';
}
