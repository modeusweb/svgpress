import { describe, it, expect } from 'vitest';
import { sanitizeEntryName } from '@/lib/zip';

describe('sanitizeEntryName', () => {
  it('strips path components', () => {
    const used = new Set<string>();
    expect(sanitizeEntryName('../evil.svg', used)).toBe('evil.svg');
    expect(sanitizeEntryName('a/b/c.svg', used)).toBe('c.svg');
  });
  it('prevents traversal via leading separators', () => {
    const used = new Set<string>();
    expect(sanitizeEntryName('..\\..\\x.svg', used)).toBe('x.svg');
  });
  it('deduplicates within archive', () => {
    const used = new Set<string>();
    const a = sanitizeEntryName('icon.svg', used);
    const b = sanitizeEntryName('icon.svg', used);
    expect(a).toBe('icon.svg');
    expect(b).toBe('icon (2).svg');
  });
  it('ensures svg extension', () => {
    const used = new Set<string>();
    expect(sanitizeEntryName('noext', used)).toBe('noext.svg');
  });
});
