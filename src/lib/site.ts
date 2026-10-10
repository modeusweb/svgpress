/**
 * Central site/SEO configuration. The canonical site URL is configurable via
 * NEXT_PUBLIC_SITE_URL so metadata, canonical links, Open Graph, robots.txt and
 * sitemap.xml all resolve to the correct absolute origin in any environment.
 */
const rawUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://modeusweb.github.io/svgpress';

export const siteUrl = rawUrl.replace(/\/+$/, '');

/**
 * Base path derived from the site URL (e.g. "/svgpress" for a GitHub Pages
 * project site). Kept in sync with `basePath` in next.config.mjs. Used for
 * icon/manifest links that Next.js would otherwise resolve against the origin
 * and drop the sub-path on.
 */
export const basePath = (() => {
  try {
    return new URL(siteUrl).pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
})();

export const siteName = 'SVGPress';
export const siteShortName = 'SVGPress';
export const siteDescription =
  'Batch-optimize SVG files in your browser with SVGO. Smaller SVGs, cleaner markup, zero uploads. Free, private, and runs entirely on your device.';

export const author = {
  name: 'modeusweb',
  email: 'modeusweb@gmail.com',
  url: siteUrl,
};

export const repoUrl = 'https://github.com/modeusweb/svgpress';

export const keywords = [
  'svg optimizer',
  'svgo',
  'compress svg',
  'minify svg',
  'svg bulk',
  'batch svg',
  'svg compression',
  'optimize svg online',
  'svg cleaner',
  'vector optimizer',
  'svg tools',
  'reduce svg file size',
];
