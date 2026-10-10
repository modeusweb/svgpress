import type { Config as SvgoConfig } from 'svgo';
import type { OptimizerSettings, PresetId } from '@/types';
import { clamp } from '@/lib/utils/format';

export interface PresetDescription {
  id: PresetId;
  name: string;
  tagline: string;
  detail: string;
  defaults: OptimizerSettings;
}

const floatPrecision = (n: number) => clamp(Math.round(n), 0, 8);

export const PRESETS: Record<Exclude<PresetId, 'custom'>, PresetDescription> = {
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    tagline: 'Recommended',
    detail:
      'Good size reduction while preserving compatibility. Keeps viewBox and IDs so external CSS, JS, masks and gradients keep working.',
    defaults: {
      preset: 'balanced',
      removeComments: true,
      removeMetadata: true,
      removeEditorData: true,
      removeUselessDefs: true,
      removeHiddenElems: true,
      removeViewBox: false,
      cleanupIds: false,
      convertPathData: true,
      convertShapeToPath: true,
      mergePaths: true,
      collapseGroups: true,
      convertTransform: true,
      minifyStyles: true,
      cleanupNumericValues: true,
      floatPrecision: 3,
      removeUnknownsAndDefaults: true,
      keepLicenseComments: true,
      removeXMLDeclaration: false,
      removeXMLProcInst: true,
      customConfig: '',
    },
  },
  maximum: {
    id: 'maximum',
    name: 'Maximum compression',
    tagline: 'Aggressive',
    detail:
      'Smallest possible output. Merges paths aggressively and minifies IDs. May reduce precision and break external ID references - verify the result.',
    defaults: {
      preset: 'maximum',
      removeComments: true,
      removeMetadata: true,
      removeEditorData: true,
      removeUselessDefs: true,
      removeHiddenElems: true,
      removeViewBox: false,
      cleanupIds: true,
      convertPathData: true,
      convertShapeToPath: true,
      mergePaths: true,
      collapseGroups: true,
      convertTransform: true,
      minifyStyles: true,
      cleanupNumericValues: true,
      floatPrecision: 2,
      removeUnknownsAndDefaults: true,
      keepLicenseComments: false,
      removeXMLDeclaration: false,
      removeXMLProcInst: true,
      customConfig: '',
    },
  },
  safe: {
    id: 'safe',
    name: 'Safe / Preserve compatibility',
    tagline: 'Conservative',
    detail:
      'Minimal, low-risk cleanup. Does not minify IDs, merge paths or convert shapes. Ideal when you cannot visually verify every file.',
    defaults: {
      preset: 'safe',
      removeComments: true,
      removeMetadata: true,
      removeEditorData: true,
      removeUselessDefs: true,
      removeHiddenElems: false,
      removeViewBox: false,
      cleanupIds: false,
      convertPathData: false,
      convertShapeToPath: false,
      mergePaths: false,
      collapseGroups: true,
      convertTransform: false,
      minifyStyles: false,
      cleanupNumericValues: false,
      floatPrecision: 3,
      removeUnknownsAndDefaults: false,
      keepLicenseComments: true,
      removeXMLDeclaration: false,
      removeXMLProcInst: true,
      customConfig: '',
    },
  },
};

export const DEFAULT_SETTINGS: OptimizerSettings = PRESETS.balanced.defaults;

export function getPreset(id: PresetId): PresetDescription | null {
  if (id === 'custom') return null;
  return PRESETS[id];
}

export const PRESET_LIST: PresetDescription[] = [
  PRESETS.balanced,
  PRESETS.maximum,
  PRESETS.safe,
];

export function settingsMatchPreset(settings: OptimizerSettings, id: PresetId): boolean {
  const preset = getPreset(id);
  if (!preset) return false;
  const d = preset.defaults;
  const keys = Object.keys(d) as (keyof OptimizerSettings)[];
  return keys.every((key) => settings[key] === d[key]);
}

/**
 * Build an SVGO v3 Config object from the app settings.
 *
 * IMPORTANT (SVGO v3 behavior): top-level `active` on plugin objects is NOT
 * honored - plugins must be toggled via `preset-default` `params.overrides`,
 * where a plugin name maps to `false` to disable it or to a params object to
 * reconfigure it. Every toggle below maps to a real, documented preset-default
 * plugin, so user choices genuinely change the optimizer.
 */
/**
 * Build an SVGO v4 Config object from the app settings.
 *
 * IMPORTANT (SVGO v4 behavior):
 * - A top-level `active` flag on plugin objects is NOT honored; plugins must be
 *   toggled via `preset-default`'s `params.overrides` (name -> false to disable,
 *   or -> a params object to reconfigure).
 * - `removeViewBox` was REMOVED from preset-default in v4 (it is now an opt-in
 *   plugin). We add it back as a standalone plugin after preset-default so the
 *   user's "Remove viewBox" toggle genuinely takes effect (off by default).
 */
export function buildSvgoConfig(settings: OptimizerSettings): SvgoConfig {
  const precision = floatPrecision(settings.floatPrecision);

  const overrides: Record<string, boolean | Record<string, unknown>> = {
    removeXMLProcInst: settings.removeXMLProcInst,
    removeComments: settings.removeComments
      ? settings.keepLicenseComments
        ? { preservePatterns: [/[Ll]icense/i, /(?:^|[^A-Za-z])MIT(?:$|[^A-Za-z])/] }
        : true
      : false,
    removeMetadata: settings.removeMetadata,
    removeEditorsNSData: settings.removeEditorData,
    removeUselessDefs: settings.removeUselessDefs,
    removeHiddenElems: settings.removeHiddenElems,
    cleanupIds: settings.cleanupIds,
    convertPathData: settings.convertPathData ? { floatPrecision: precision } : false,
    convertShapeToPath: settings.convertShapeToPath,
    mergePaths: settings.mergePaths,
    collapseGroups: settings.collapseGroups,
    convertTransform: settings.convertTransform,
    minifyStyles: settings.minifyStyles,
    cleanupNumericValues: settings.cleanupNumericValues ? { floatPrecision: precision } : false,
    removeUnknownsAndDefaults: settings.removeUnknownsAndDefaults,
  };

  const plugins: SvgoConfig['plugins'] = [
    {
      name: 'preset-default',
      params: { overrides },
    },
  ];

  // removeViewBox is not part of preset-default in SVGO v4, and an `active`
  // flag on a standalone plugin is NOT honored - the only reliable way to keep
  // it OFF is to omit it entirely. We add it only when the user opts in.
  if (settings.removeViewBox) {
    plugins.push({ name: 'removeViewBox' });
  }

  return {
    multipass: true,
    js2svg: { indent: 0, pretty: false },
    plugins,
  };
}

