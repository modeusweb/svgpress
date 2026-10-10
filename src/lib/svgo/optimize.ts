// Use SVGO's official browser build. The package root (`svgo`) resolves to the
// Node entry (svgo-node.js) which imports Node-only APIs (os, fs, url, path);
// `svgo/browser` is the framework-agnostic implementation that runs cleanly in
// the browser and inside a Web Worker.
import { optimize } from 'svgo/browser';
import type { OptimizerSettings } from '@/types';
import { buildSvgoConfig } from './config';

export interface OptimizeResult {
  content: string;
  /** Byte length of the optimized content. */
  size: number;
}

export class OptimizeError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OptimizeError';
  }
}

/** Turn an arbitrary thrown value into a user-friendly message. */
export function describeError(err: unknown): string {
  if (err instanceof OptimizeError) return err.message;
  if (err instanceof Error) {
    // SVGO often throws errors like "Error in plugin X: ..."
    const msg = err.message.replace(/^Error:\s*/, '').trim();
    if (/parse|xml|sax/i.test(msg)) {
      return 'Invalid SVG: the file could not be parsed as XML.';
    }
    if (/plugin/i.test(msg)) {
      return `Optimizer plugin error: ${truncate(msg, 160)}`;
    }
    return truncate(msg || 'Unknown error', 200);
  }
  return 'Unknown error during optimization.';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

/**
 * Optimize a single SVG string using the provided settings. This runs purely
 * in-process (works in browser and worker). Callers are responsible for
 * offloading heavy batches to a worker.
 */
export function optimizeSvg(svg: string, settings: OptimizerSettings): OptimizeResult {
  if (!svg || !svg.trim()) {
    throw new OptimizeError('Cannot optimize empty SVG.');
  }

  // Resolve configuration, merging any validated custom config.
  const config = resolveConfig(settings);

  try {
    const result = optimize(svg, config);
    if (typeof result?.data !== 'string') {
      throw new OptimizeError('Optimizer produced no output.');
    }
    return {
      content: result.data,
      size: byteLength(result.data),
    };
  } catch (err) {
    throw new OptimizeError(describeError(err), err);
  }
}

/** Resolve final SVGO config from settings, applying an optional custom plugin merge. */
function resolveConfig(settings: OptimizerSettings) {
  const base = buildSvgoConfig(settings);
  const custom = parseCustomConfig(settings.customConfig);
  if (!custom) return base;
  // Append any additional plugins from the custom config after preset-default.
  // We never execute user JS - only plugin names and params. Function plugins
  // (`fn`) are rejected upstream by Zod and by parseCustomConfig.
  const preset = base.plugins?.[0];
  const extra = custom.plugins ?? [];
  return {
    ...base,
    plugins: [preset, ...extra],
  } as ReturnType<typeof buildSvgoConfig>;
}

export interface ParsedCustomConfig {
  plugins?: unknown[];
  [key: string]: unknown;
}

/**
 * Safely parse a custom SVGO config JSON string. Returns null when absent.
 * Rejects function-valued entries (impossible in JSON but guarded for safety).
 */
export function parseCustomConfig(raw?: string): ParsedCustomConfig | null {
  if (!raw || !raw.trim()) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new OptimizeError('Custom configuration is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new OptimizeError('Custom configuration must be a JSON object.');
  }
  const plugins = (parsed as ParsedCustomConfig).plugins;
  if (plugins !== undefined && !Array.isArray(plugins)) {
    throw new OptimizeError('Custom configuration "plugins" must be an array.');
  }
  // Reject function-valued plugin entries as a defense-in-depth measure.
  for (const p of plugins ?? []) {
    if (p && typeof p === 'object' && 'fn' in p) {
      throw new OptimizeError('Function plugins are not allowed in custom configuration.');
    }
  }
  return parsed as ParsedCustomConfig;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
