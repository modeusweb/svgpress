# SVGPress

**Smaller SVGs. Cleaner markup. One workflow.**

A fast, private, browser-based tool to batch-optimize SVG files with [SVGO](https://github.com/svg/svgo). Drop in one or many SVGs, tune the optimization, preview before/after, and download results individually or as a single ZIP — **100% in your browser, with zero uploads**.

- **Live demo:** https://modeusweb.github.io/svgpress/
- **Source:** https://github.com/modeusweb/svgpress

## Features

- **Runs entirely in your browser** — files are never uploaded anywhere.
- **Batch processing** — drag-and-drop or browse, optimize many files at once in a background worker.
- **Presets & fine control** — Balanced, Maximum, and Safe presets, plus per-plugin toggles and an advanced JSON editor.
- **Before/after preview** — sandboxed rendering (scripts never execute) with a code view.
- **Honest stats** — real byte and percentage savings per file and in total.
- **Download** — individual SVGs or everything as a `.zip`.
- **Dark & light themes**, fully responsive, keyboard accessible.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start the dev server                 |
| `npm run build`       | Production build (static export)     |
| `npm test`            | Unit & integration tests             |
| `npm run test:e2e`    | End-to-end tests (Playwright)        |
| `npm run lint`        | Lint the code                        |
| `npm run typecheck`   | Type-check with `tsc`                |
| `npm run icons`       | Regenerate favicons & social image   |
| `npm run serve:export`| Preview the built `out/` locally     |

## Tech

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · SVGO v4 · JSZip · Zod · Vitest · Playwright.

## Deployment

The site is a static export (`output: 'export'`, base path `/svgpress`) deployed to GitHub Pages via GitHub Actions on every push to `main`. To preview the production build locally:

```bash
npm run build
npm run serve:export   # http://localhost:3000/svgpress/
```

> Note: SVGO optimizes size but is not a security sanitizer — always review SVGs from untrusted sources.

## License

MIT © [modeusweb](https://github.com/modeusweb)
