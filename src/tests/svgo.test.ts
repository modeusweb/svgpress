import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { optimizeSvg, describeError, OptimizeError } from '@/lib/svgo/optimize';
import { DEFAULT_SETTINGS, PRESETS, buildSvgoConfig } from '@/lib/svgo/config';
import { validateCustomConfig } from '@/lib/svgo/validate';

function fixture(name: string): string {
  return readFileSync(join(process.cwd(), 'src', 'tests', 'fixtures', name), 'utf8');
}

describe('optimizeSvg', () => {
  it('optimizes a valid SVG and reduces size', () => {
    const input = fixture('gradient.svg');
    const result = optimizeSvg(input, DEFAULT_SETTINGS);
    expect(result.content).toContain('<svg');
    expect(result.content).toContain('grad1'); // ids preserved in balanced
    expect(result.size).toBeLessThan(new TextEncoder().encode(input).length);
    expect(result.size).toBe(new TextEncoder().encode(result.content).length);
  });

  it('preserves viewBox in balanced mode', () => {
    const input = fixture('gradient.svg');
    const result = optimizeSvg(input, DEFAULT_SETTINGS);
    expect(result.content).toContain('viewBox');
  });

  it('removes metadata and comments in balanced mode', () => {
    const input = fixture('gradient.svg');
    const result = optimizeSvg(input, DEFAULT_SETTINGS);
    expect(result.content).not.toContain('Editor metadata');
    expect(result.content).not.toContain('A gradient demo');
  });

  it('maximum preset produces smaller or equal output than safe', () => {
    const input = fixture('paths.svg');
    const max = optimizeSvg(input, PRESETS.maximum.defaults);
    const safe = optimizeSvg(input, PRESETS.safe.defaults);
    expect(max.size).toBeLessThanOrEqual(safe.size);
  });

  it('keeps license comments when enabled', () => {
    const input = fixture('license.svg');
    const settings = { ...DEFAULT_SETTINGS, keepLicenseComments: true };
    const result = optimizeSvg(input, settings);
    expect(result.content.toLowerCase()).toContain('mit');
  });

  it('throws on invalid SVG without producing output', () => {
    const input = fixture('invalid.svg');
    expect(() => optimizeSvg(input, DEFAULT_SETTINGS)).toThrow();
  });

  it('throws on empty input', () => {
    expect(() => optimizeSvg('   ', DEFAULT_SETTINGS)).toThrow(OptimizeError);
  });

  it('floatPrecision setting is reflected in config', () => {
    const config = buildSvgoConfig({ ...DEFAULT_SETTINGS, floatPrecision: 1 });
    const preset = (config.plugins ?? []).find(
      (p) => typeof p === 'object' && p?.name === 'preset-default',
    );
    const overrides = (preset as { params?: { overrides?: Record<string, unknown> } })?.params
      ?.overrides;
    expect(overrides?.convertPathData).toMatchObject({ floatPrecision: 1 });
  });

  it('removeViewBox is omitted by default and present only when enabled', () => {
    const off = buildSvgoConfig(DEFAULT_SETTINGS);
    expect((off.plugins ?? []).some((p) => typeof p === 'object' && p?.name === 'removeViewBox')).toBe(
      false,
    );
    const on = buildSvgoConfig({ ...DEFAULT_SETTINGS, removeViewBox: true });
    expect((on.plugins ?? []).some((p) => typeof p === 'object' && p?.name === 'removeViewBox')).toBe(
      true,
    );
  });

  it('removeViewBox toggle actually removes viewBox when enabled', () => {
    const input = fixture('gradient.svg');
    const on = optimizeSvg(input, { ...DEFAULT_SETTINGS, removeViewBox: true });
    const off = optimizeSvg(input, { ...DEFAULT_SETTINGS, removeViewBox: false });
    expect(off.content).toContain('viewBox');
    expect(on.content).not.toContain('viewBox');
  });

  it('disabling a toggle sets the override to false', () => {
    const config = buildSvgoConfig({ ...DEFAULT_SETTINGS, mergePaths: false });
    const preset = (config.plugins ?? []).find(
      (p) => typeof p === 'object' && p?.name === 'preset-default',
    );
    const overrides = (preset as { params?: { overrides?: Record<string, unknown> } })?.params
      ?.overrides;
    expect(overrides?.mergePaths).toBe(false);
  });
});

describe('describeError', () => {
  it('maps parse errors', () => {
    expect(describeError(new Error('Parse error in XML'))).toMatch(/Invalid SVG/);
  });
  it('passes through generic messages', () => {
    expect(describeError(new Error('something broke'))).toContain('something broke');
  });
});

describe('validateCustomConfig', () => {
  it('accepts valid config', () => {
    expect(validateCustomConfig('{"plugins":[{"name":"prefixIds"}]}').ok).toBe(true);
  });
  it('rejects invalid json', () => {
    expect(validateCustomConfig('{oops').ok).toBe(false);
  });
  it('rejects non-array plugins', () => {
    expect(validateCustomConfig('{"plugins":5}').ok).toBe(false);
  });
  it('treats empty string as ok', () => {
    expect(validateCustomConfig('').ok).toBe(true);
  });
});
