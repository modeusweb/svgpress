# SVGPress

**Smaller SVGs. Cleaner markup. One workflow.**

SVGPress is a production-quality, fully client-side web tool for batch-optimizing
SVG files with [SVGO](https://github.com/svg/svgo). Drop in one or many SVGs,
tune the optimization, preview before/after, and download individual results or
everything as a single ZIP — **all in your browser, with zero uploads**.

## Highlights

- **100% local processing.** Files are read into memory and optimized with SVGO
  running inside a Web Worker. Nothing is ever sent to a server.
- **Bulk workflow.** Drag-and-drop or browse, queue many files, optimize in
  parallel with bounded concurrency, and track each file's status independently.
- **Real configuration control.** Presets (Balanced / Maximum / Safe) plus
  fine-grained toggles that map to actual SVGO plugins, an advanced JSON editor
  with validation, and import/export of settings.
- **Honest statistics.** Byte and percentage savings are computed from real
  sizes (never summed per-file percentages). Negative savings are shown as-is.
- **Safe previews.** SVGs are rendered from isolated image `Blob` URLs, so
  embedded scripts, external references, and event handlers never execute.
- **Premium dark-first UI** with light & system themes, WCAG-minded semantics,
  keyboard navigation, focus management, and `prefers-reduced-motion` support.
- **Fully responsive** from 360 px phones to wide desktops.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** with CSS-variable design tokens
- **Heroicons** for icons
- **SVGO v4** as the optimization engine (official `svgo/browser` build)
- **JSZip** for client-side ZIP creation
- **Zod v4** for configuration validation
- **Vitest** + **React Testing Library** for unit/integration tests
- **Playwright** for end-to-end tests
- **ESLint 10** (flat config)

## Getting started

```bash
npm install
npm run dev        # start the dev server at http://localhost:3000
```

### Scripts

| Script            | Description                                  |
| ----------------- | -------------------------------------------- |
| `npm run dev`     | Start the development server                 |
| `npm run build`   | Production build                             |
| `npm run start`   | Serve the production build                   |
| `npm run lint`    | Run ESLint                                   |
| `npm run typecheck` | Type-check with `tsc --noEmit`            |
| `npm test`        | Run unit/integration tests (Vitest)          |
| `npm run test:e2e`| Run Playwright end-to-end tests              |
| `npm run icons`   | Regenerate favicons & social image (sharp)   |
| `npm run serve:export` | Preview the static `out/` build locally   |

## Architecture

```
src/
  app/                 Next.js App Router: layout, page, global styles
  components/
    upload/            Dropzone
    files/             File table, rows, sorting/search/filter controls
    preview/           Sandboxed SVG preview + code view
    settings/          Settings panel + dialog
    summary/           Aggregate statistics
    ui/                Buttons, modal, toasts, toggles, status badges
  hooks/               use-queue, use-theme, use-toast, use-download
  lib/
    svgo/              Optimizer core, presets, config builder, worker, pool
    files/             Validation, name sanitization, persistence
    zip/               ZIP creation + safe entry names
    queue/             Queue reducer + statistics
    utils/             Formatting helpers
  types/               Domain models
  tests/               Unit & integration tests + SVG fixtures
e2e/                   Playwright specs
```

### Why a Web Worker?

Optimization is CPU-bound. `WorkerPool` runs SVGO inside module Web Workers so
the UI never blocks during large batches. If workers are unavailable (e.g. some
test environments), the pool transparently falls back to running SVGO on the
main thread in cooperative chunks — still correct, just not off-loaded.

### SVGO integration note (v4)

SVGO's package `main` entry (`svgo-node.js`) imports Node-only APIs (`os`, `fs`,
`url`, `path`) which are unsafe in the browser. SVGPress uses SVGO's official
browser build (`svgo/browser`). Furthermore, SVGO ignores a top-level `active`
flag on plugin objects; plugins must be toggled through `preset-default`'s
`params.overrides`. In v4 `removeViewBox` was removed from `preset-default` and
is now an opt-in plugin — `buildSvgoConfig` only appends it when the user opts
in, so viewBox is preserved by default. `buildSvgoConfig` uses these mechanisms
so every UI toggle genuinely changes the optimizer.

## Security

- User SVGs are never uploaded, stored remotely, or sent to third parties.
- Previews use `<img>` with a `Blob` URL — scripts and external resources inside
  an SVG cannot execute in the page.
- File names are sanitized (path traversal, control characters, absolute paths)
  before download or archiving. Archive entries are de-duplicated and path-safe.
- Custom SVGO JSON is schema-validated with Zod; function plugins and arbitrary
  code execution are rejected. No `eval`/`new Function` anywhere.
- SVGO is an **optimizer, not a security sanitizer**. Always review SVGs from
  untrusted sources before shipping them.

## SEO & metadata

SVGPress ships a complete, production-ready SEO setup:

- **Metadata** (`src/app/layout.tsx`): title template, description, keywords,
  author/creator (`modeusweb`), canonical URL, robots + Googlebot directives
  (large image preview), Open Graph and Twitter `summary_large_image` cards.
- **Structured data**: JSON-LD `Organization` + `WebApplication` graph injected
  into `<head>` (`src/lib/structured-data.ts`).
- **Sitemap & robots**: `src/app/sitemap.ts` and `src/app/robots.ts` generate
  `/sitemap.xml` and `/robots.txt` automatically.
- **Web App Manifest**: `src/app/manifest.ts` → `/manifest.webmanifest`.

The canonical origin is configurable via `NEXT_PUBLIC_SITE_URL` (see
`.env.example`). Set it to your production URL before deploying so canonical,
Open Graph, `robots.txt` and `sitemap.xml` resolve correctly.

### Favicons & social image

Icons are generated from a single SVG source with [sharp](https://sharp.pixelplumbing.com/):

```bash
npm run icons
```

This writes to `public/`:

| File                 | Size      | Purpose                          |
| -------------------- | --------- | -------------------------------- |
| `favicon.ico`        | 16/32/48  | Legacy browser tab icon          |
| `icon-16.png`        | 16×16     | Standard favicon                 |
| `icon-32.png`        | 32×32     | Standard favicon                 |
| `icon-48.png`        | 48×48     | Standard favicon                 |
| `icon-192.png`       | 192×192   | PWA / Android home screen        |
| `icon-512.png`       | 512×512   | PWA / splash (any + maskable)    |
| `apple-touch-icon.png` | 180×180 | iOS home screen                  |
| `og-image.png`       | 1200×630  | Open Graph / Twitter card        |

To change the branding, edit `scripts/icon-source.svg` and
`scripts/og-source.svg`, then re-run `npm run icons`.

## Deployment (GitHub Pages)

SVGPress is exported as a fully static site and deployed to GitHub Pages via
GitHub Actions.

- **Static export**: `next.config.mjs` sets `output: 'export'` with
  `basePath`/`assetPrefix` of `/svgpress` (the repository name) and
  `trailingSlash: true`. `npm run build` produces the `out/` directory.
- **Workflow**: `.github/workflows/deploy.yml` builds on every push to `main`
  and deploys `out/` to GitHub Pages using the official Pages actions.
- **`.nojekyll`**: present in `public/` (and copied to `out/`) so GitHub Pages
  serves the `_next/` assets untouched.
- **Site URL**: the workflow sets `NEXT_PUBLIC_SITE_URL=https://modeusweb.github.io/svgpress`,
  which drives canonical, Open Graph, `robots.txt` and `sitemap.xml`.

### One-time repository setup

1. Push this repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the workflow manually) — the site is published at
   `https://modeusweb.github.io/svgpress/`.

### Preview the export locally

```bash
npm run build
npm run serve:export   # http://localhost:3000/svgpress/
```

If you later move to a custom domain or rename the repository, update
`basePath`/`assetPrefix` in `next.config.mjs` and `NEXT_PUBLIC_SITE_URL` in the
workflow to match.

## Testing

```bash
npm test         # 62 unit/integration tests
npm run test:e2e # Playwright e2e (auto-builds and serves the app)
```

Fixtures under `src/tests/fixtures/` include SVGs with gradients, masks,
`viewBox`, IDs, comments, license headers, and invalid XML.

## Limitations

- No session restore of dropped files (only settings persist) to keep memory use
  predictable. Files live in memory for the current tab session.
- Optimization is size-focused; aggressive presets may alter precision or ID
  names, so a visual verification is recommended for `Maximum` compression.

## License

MIT
