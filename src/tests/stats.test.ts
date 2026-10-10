import { describe, it, expect } from 'vitest';
import { computeSummary, sortItems, filterItems } from '@/lib/queue/stats';
import type { QueueItem } from '@/types';

function item(o: Partial<QueueItem> = {}): QueueItem {
  return {
    id: Math.random().toString(),
    originalName: 'f.svg',
    outputName: 'f_optimized.svg',
    originalSize: 1000,
    originalContent: '<svg/>',
    status: 'ready',
    ...o,
  };
}

describe('computeSummary', () => {
  it('aggregates only successful items', () => {
    const items = [
      item({ id: '1', status: 'optimized', originalSize: 1000, optimized: { content: '', size: 400 } }),
      item({ id: '2', status: 'optimized', originalSize: 2000, optimized: { content: '', size: 1000 } }),
      item({ id: '3', status: 'failed', originalSize: 500 }),
    ];
    const s = computeSummary(items);
    expect(s.total).toBe(3);
    expect(s.successful).toBe(2);
    expect(s.failed).toBe(1);
    expect(s.originalSize).toBe(3000);
    expect(s.optimizedSize).toBe(1400);
    expect(s.savedBytes).toBe(1600);
    expect(s.savedPercent).toBeCloseTo((1600 / 3000) * 100);
  });

  it('reports negative savings correctly', () => {
    const items = [
      item({ status: 'no_savings', originalSize: 100, optimized: { content: '', size: 300 } }),
    ];
    const s = computeSummary(items);
    expect(s.savedBytes).toBe(-200);
    expect(s.savedPercent).toBeLessThan(0);
  });

  it('returns zero percent when no originals', () => {
    expect(computeSummary([]).savedPercent).toBe(0);
  });
});

describe('sortItems', () => {
  const items = [
    item({ id: '1', originalName: 'b.svg', originalSize: 200 }),
    item({ id: '2', originalName: 'a.svg', originalSize: 100 }),
  ];
  it('sorts by name asc', () => {
    expect(sortItems(items, 'name', 'asc').map((i) => i.originalName)).toEqual(['a.svg', 'b.svg']);
  });
  it('sorts by size desc', () => {
    expect(sortItems(items, 'originalSize', 'desc').map((i) => i.originalSize)).toEqual([200, 100]);
  });
});

describe('filterItems', () => {
  const items = [
    item({ id: '1', originalName: 'alpha.svg', status: 'optimized' }),
    item({ id: '2', originalName: 'beta.svg', status: 'failed' }),
  ];
  it('filters by search', () => {
    expect(filterItems(items, 'alpha', 'all').map((i) => i.id)).toEqual(['1']);
  });
  it('filters by status', () => {
    expect(filterItems(items, '', 'failed').map((i) => i.id)).toEqual(['2']);
  });
});
