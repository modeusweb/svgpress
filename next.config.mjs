/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Static HTML export for GitHub Pages (project site under /svgpress).
  output: 'export',
  basePath: '/svgpress',
  assetPrefix: '/svgpress',
  trailingSlash: true,
  images: { unoptimized: true },

  // Next.js 16 blocks cross-origin dev-resource requests by default. When the
  // app is opened via 127.0.0.1 (e.g. automated tooling) the HMR/RSC client is
  // rejected, breaking interactivity in dev. Allow local origins explicitly.
  allowedDevOrigins: ['127.0.0.1', 'localhost', '100.78.68.8'],
};

export default nextConfig;


