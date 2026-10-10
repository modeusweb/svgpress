// Minimal static file server for the exported `out/` directory, mounted under
// the site base path (/svgpress) so it behaves like GitHub Pages locally.
// Usage: npm run serve:export   (serves http://localhost:3000/svgpress/)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'out');
const BASE = '/svgpress';
const PORT = Number(process.env.PORT || 3000);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

    if (urlPath === '/' || urlPath === '') {
      res.writeHead(302, { Location: `${BASE}/` });
      res.end();
      return;
    }
    if (!urlPath.startsWith(`${BASE}/`) && urlPath !== BASE) {
      res.writeHead(404).end('Not found');
      return;
    }

    // Strip the base path and normalize to a file inside out/.
    let rel = urlPath.slice(BASE.length).replace(/^\/+/, '');
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const filePath = normalize(join(OUT, rel));
    if (!filePath.startsWith(OUT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    let target = filePath;
    try {
      const s = await stat(target);
      if (s.isDirectory()) target = join(target, 'index.html');
    } catch {
      // Fall back to the SPA/404 page.
      target = join(OUT, '404.html');
    }

    const body = await readFile(target);
    res.writeHead(200, {
      'Content-Type': TYPES[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500).end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Serving static export at http://localhost:${PORT}${BASE}/`);
});
