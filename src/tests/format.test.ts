import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatPercent,
  computeSavedBytes,
  computeSavedPercent,
} from '@/lib/utils/format';

describe('formatBytes', () => {
  it('formats bytes below 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
  });
  it('formats KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(20 * 1024)).toBe('20 KB');
  });
  it('formats MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
  it('handles invalid input', () => {
    expect(formatBytes(-1)).toBe('-');
    expect(formatBytes(NaN)).toBe('-');
  });
});

describe('computeSavedBytes / computeSavedPercent', () => {
  it('computes positive savings', () => {
    expect(computeSavedBytes(1000, 400)).toBe(600);
    expect(computeSavedPercent(1000, 400)).toBeCloseTo(60);
  });
  it('handles negative savings (growth)', () => {
    expect(computeSavedBytes(400, 1000)).toBe(-600);
    expect(computeSavedPercent(400, 1000)).toBeCloseTo(-150);
  });
  it('handles zero original', () => {
    expect(computeSavedPercent(0, 100)).toBe(0);
  });
});

describe('formatPercent', () => {
  it('renders one decimal', () => {
    expect(formatPercent(42.35)).toBe('42.4%');
  });
});
