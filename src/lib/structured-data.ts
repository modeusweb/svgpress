import { siteUrl, siteName, siteDescription, author } from './site';

/** Organization schema for the brand/author. */
export function organizationSchema() {
  return {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: siteName,
    url: siteUrl,
    email: author.email,
    founder: {
      '@type': 'Person',
      name: author.name,
      email: author.email,
      url: siteUrl,
    },
  };
}

/** WebApplication schema describing the tool itself. */
export function webApplicationSchema() {
  return {
    '@type': 'WebApplication',
    '@id': `${siteUrl}/#webapp`,
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern browser with JavaScript and Web Workers',
    softwareVersion: '1.0.0',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Batch SVG optimization with SVGO',
      'Drag-and-drop multi-file upload',
      'Before/after preview with sandboxed rendering',
      'Optimization presets (Balanced, Maximum, Safe)',
      'Individual and ZIP downloads',
      'Runs entirely in the browser - no uploads',
    ],
    author: {
      '@type': 'Person',
      name: author.name,
      email: author.email,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
  };
}

/** Combined JSON-LD graph injected into the document head. */
export function structuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationSchema(), webApplicationSchema()],
  };
}
