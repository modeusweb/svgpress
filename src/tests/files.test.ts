import { describe, it, expect } from 'vitest';
import {
  validateSvgFile,
  looksLikeSvg,
  sanitizeFileName,
  buildOutputName,
  utf8ByteLength,
} from '@/lib/files';

describe('validateSvgFile', () => {
  it('accepts a normal svg', () => {
    expect(validateSvgFile({ name: 'a.svg', size: 100 })).toEqual({ ok: true });
  });
  it('rejects empty file', () => {
    expect(validateSvgFile({ name: 'a.svg', size: 0 }).ok).toBe(false);
  });
  it('rejects non-svg extension', () => {
    expect(validateSvgFile({ name: 'a.png', size: 100 }).ok).toBe(false);
  });
  it('rejects oversize file', () => {
    expect(validateSvgFile({ name: 'a.svg', size: 50 * 1024 * 1024 }).ok).toBe(false);
  });
});

describe('looksLikeSvg', () => {
  it('detects svg documents', () => {
    expect(looksLikeSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(true);
  });
  it('rejects html', () => {
    expect(looksLikeSvg('<!DOCTYPE html><html></html>')).toBe(false);
  });
});

describe('sanitizeFileName', () => {
  it('strips directory components', () => {
    expect(sanitizeFileName('../../etc/passwd.svg')).toBe('passwd.svg');
  });
  it('strips path separators', () => {
    expect(sanitizeFileName('C:\\folder\\icon.svg')).toBe('icon.svg');
    expect(sanitizeFileName('/var/icon.svg')).toBe('icon.svg');
  });
  it('removes control chars', () => {
    expect(sanitizeFileName('a\u0000b.svg')).toBe('ab.svg');
  });
  it('preserves unicode and spaces', () => {
    expect(sanitizeFileName('иконка логотип.svg')).toBe('иконка логотип.svg');
  });
  it('falls back to file for empty', () => {
    expect(sanitizeFileName('...')).toBe('file');
  });
});

describe('buildOutputName', () => {
  it('keeps the original name without an _optimized suffix', () => {
    const taken = new Set<string>();
    expect(buildOutputName('logo.svg', taken)).toBe('logo.svg');
  });
  it('deduplicates collisions', () => {
    const taken = new Set<string>();
    const a = buildOutputName('logo.svg', taken);
    const b = buildOutputName('logo.svg', taken);
    expect(a).toBe('logo.svg');
    expect(b).toBe('logo (2).svg');
  });
  it('ensures .svg extension', () => {
    const taken = new Set<string>();
    expect(buildOutputName('logo', taken)).toBe('logo.svg');
  });
});

describe('utf8ByteLength', () => {
  it('counts multibyte characters', () => {
    expect(utf8ByteLength('a')).toBe(1);
    expect(utf8ByteLength('é')).toBe(2);
    expect(utf8ByteLength('😀')).toBe(4);
  });
});
