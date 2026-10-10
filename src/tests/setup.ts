import '@testing-library/jest-dom/vitest';

// jsdom lacks URL.createObjectURL; provide a minimal stub for tests.
if (!('createObjectURL' in URL)) {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: () => 'blob:mock',
  });
}
if (!('revokeObjectURL' in URL)) {
  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: () => {},
  });
}
