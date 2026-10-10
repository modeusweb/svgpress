/**
 * Domain types for SVGPress.
 *
 * The queue item lifecycle is modelled as a discriminated-ish union through a
 * strongly typed `status` enum plus optional error / timing metadata.
 */

export type FileStatus =
  | 'ready'
  | 'queued'
  | 'optimizing'
  | 'optimized'
  | 'no_savings'
  | 'failed'
  | 'cancelled';

export interface FileResult {
  /** Optimized SVG markup. */
  content: string;
  /** Byte length of the optimized content (UTF-8). */
  size: number;
}

export interface QueueItem {
  id: string;
  /** Original file name as provided by the user. */
  originalName: string;
  /** Sanitized, collision-free name used for downloads and archive entries. */
  outputName: string;
  /** Byte length of the original SVG. */
  originalSize: number;
  /** Original SVG markup (kept in memory for re-optimization). */
  originalContent: string;

  status: FileStatus;

  optimized?: FileResult;
  /** Bytes saved (original - optimized). Can be negative when size grows. */
  savedBytes?: number;
  /** Percentage saved, relative to original size. Can be negative. */
  savedPercent?: number;

  error?: string;

  /** Monotonic task token used to discard stale results. */
  runToken?: number;

  startedAt?: number;
  completedAt?: number;
  /** Version of the configuration used to produce the current result. */
  configurationVersion?: string;

  /** Object URL for the optimized blob, used for safe <img> preview. */
  optimizedUrl?: string;
  /** Object URL for the original blob, used for safe <img> preview. */
  originalUrl?: string;
}

export type PreviewBackground = 'checker' | 'dark' | 'light';

export type PresetId = 'balanced' | 'maximum' | 'safe' | 'custom';

export interface OptimizerSettings {
  preset: PresetId;
  removeComments: boolean;
  removeMetadata: boolean;
  removeEditorData: boolean;
  removeUselessDefs: boolean;
  removeHiddenElems: boolean;
  removeViewBox: boolean;
  cleanupIds: boolean;
  convertPathData: boolean;
  convertShapeToPath: boolean;
  mergePaths: boolean;
  collapseGroups: boolean;
  convertTransform: boolean;
  minifyStyles: boolean;
  cleanupNumericValues: boolean;
  floatPrecision: number;
  removeUnknownsAndDefaults: boolean;
  keepLicenseComments: boolean;
  removeXMLDeclaration: boolean;
  removeXMLProcInst: boolean;
  /** Raw advanced SVGO config JSON (optional override / merged plugins). */
  customConfig?: string;
}

export interface AppPreferences {
  theme: 'dark' | 'light' | 'system';
  previewBackground: PreviewBackground;
  autoDownloadOnFinish: boolean;
  concurrency: number;
}
