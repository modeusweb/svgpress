import nextConfig from 'eslint-config-next';

/** Flat ESLint config for SVGPress (ESLint 9+/10 flat config format). */
const config = [
  ...nextConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'test-results/**', 'playwright-report/**'],
  },
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];

export default config;


