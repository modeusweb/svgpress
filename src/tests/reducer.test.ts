import { describe, it, expect } from 'vitest';
import { queueReducer, initialQueueState } from '@/lib/queue/reducer';
import type { QueueItem } from '@/types';

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'a',
    originalName: 'a.svg',
    outputName: 'a_optimized.svg',
    originalSize: 1000,
    originalContent: '<svg></svg>',
    status: 'ready',
    ...overrides,
  };
}

describe('queueReducer', () => {
  it('adds items', () => {
    const s = queueReducer(initialQueueState, { type: 'add', items: [makeItem()] });
    expect(s.items).toHaveLength(1);
  });

  it('removes items by id', () => {
    let s = queueReducer(initialQueueState, {
      type: 'add',
      items: [makeItem({ id: 'a' }), makeItem({ id: 'b' })],
    });
    s = queueReducer(s, { type: 'remove', ids: ['a'] });
    expect(s.items.map((i) => i.id)).toEqual(['b']);
  });

  it('computes savings on finish', () => {
    let s = queueReducer(initialQueueState, { type: 'add', items: [makeItem({ id: 'a' })] });
    s = queueReducer(s, { type: 'markQueued', ids: ['a'], runToken: 1, configVersion: 'v1' });
    s = queueReducer(s, {
      type: 'finish',
      id: 'a',
      runToken: 1,
      content: '<svg/>',
      size: 400,
      configVersion: 'v1',
    });
    const item = s.items[0];
    expect(item.status).toBe('optimized');
    expect(item.savedBytes).toBe(600);
    expect(item.savedPercent).toBeCloseTo(60);
  });

  it('marks no_savings when size grows', () => {
    let s = queueReducer(initialQueueState, { type: 'add', items: [makeItem({ id: 'a' })] });
    s = queueReducer(s, { type: 'markQueued', ids: ['a'], runToken: 1, configVersion: 'v1' });
    s = queueReducer(s, {
      type: 'finish',
      id: 'a',
      runToken: 1,
      content: 'bigger',
      size: 1500,
      configVersion: 'v1',
    });
    const item = s.items[0];
    expect(item.status).toBe('no_savings');
    expect(item.savedBytes).toBe(-500);
    expect(item.savedPercent).toBeCloseTo(-50);
  });

  it('ignores stale results (token mismatch)', () => {
    let s = queueReducer(initialQueueState, { type: 'add', items: [makeItem({ id: 'a' })] });
    s = queueReducer(s, { type: 'markQueued', ids: ['a'], runToken: 2, configVersion: 'v2' });
    // A late result from run token 1 must be discarded.
    s = queueReducer(s, {
      type: 'finish',
      id: 'a',
      runToken: 1,
      content: 'stale',
      size: 10,
      configVersion: 'v1',
    });
    expect(s.items[0].status).toBe('queued');
    expect(s.items[0].optimized).toBeUndefined();
  });

  it('records failures', () => {
    let s = queueReducer(initialQueueState, { type: 'add', items: [makeItem({ id: 'a' })] });
    s = queueReducer(s, { type: 'markQueued', ids: ['a'], runToken: 1, configVersion: 'v1' });
    s = queueReducer(s, { type: 'fail', id: 'a', runToken: 1, error: 'boom' });
    expect(s.items[0].status).toBe('failed');
    expect(s.items[0].error).toBe('boom');
  });

  it('cancels pending only', () => {
    let s = queueReducer(initialQueueState, {
      type: 'add',
      items: [makeItem({ id: 'a', status: 'ready' })],
    });
    s = queueReducer(s, { type: 'cancelPending', ids: ['a'] });
    // 'ready' is not cancelled, only queued/optimizing.
    expect(s.items[0].status).toBe('ready');
  });
});
