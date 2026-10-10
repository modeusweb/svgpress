import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/hooks/use-toast';
import { siteUrl, basePath, siteName, siteDescription, author, keywords } from '@/lib/site';
import { structuredData } from '@/lib/structured-data';

const title = 'SVGPress - Optimize SVGs in bulk';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  authors: [{ name: author.name, url: author.url }],
  creator: author.name,
  publisher: siteName,
  keywords,
  category: 'Developer Tools',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title,
    description: siteDescription,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteName} - batch SVG optimization in your browser`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description: siteDescription,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d10',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark light',
};

// Inline script applied before paint to prevent a flash of the wrong theme.
const themeInitScript = `(function(){try{var m=localStorage.getItem('svgpress:theme')||'dark';var applied=m==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):m;document.documentElement.setAttribute('data-theme',applied);document.documentElement.style.colorScheme=applied;}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Icons are linked explicitly (basePath-aware) because Next.js drops
            the sub-path from metadata icon URLs that share the metadataBase
            origin, which breaks favicons on a GitHub Pages project site. */}
        <link rel="icon" href={`${basePath}/favicon.ico`} sizes="any" />
        <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/icon-192.png`} />
        <link rel="icon" type="image/png" sizes="512x512" href={`${basePath}/icon-512.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${basePath}/apple-touch-icon.png`} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
      </head>
      <body className="min-h-screen bg-bg text-content antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
