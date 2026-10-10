// Generates the full favicon / PWA / Open Graph image set for SVGPress.
// Run with: npm run icons
//
// Source is a single SVG (scripts/icon-source.svg). Outputs are written to
// public/ and wired up in src/app/layout.tsx metadata + manifest.webmanifest.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconSvg = readFileSync(join(__dirname, 'icon-source.svg'));

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const BG = { r: 0x0b, g: 0x0d, b: 0x10, alpha: 1 };

async function png(size, name, { flatten = false } = {}) {
  let img = sharp(iconSvg, { density: 384 }).resize(size, size, { fit: 'contain' });
  if (flatten) img = img.flatten({ background: BG });
  await img.png().toFile(join(publicDir, name));
  console.log(`  ✓ ${name} (${size}x${size})`);
}

async function main() {
  console.log('Generating favicons...');

  // Standard PNG favicons (transparent corners from the rounded source).
  await png(16, 'icon-16.png');
  await png(32, 'icon-32.png');
  await png(48, 'icon-48.png');

  // PWA icons (opaque, flattened for crisp rendering).
  await png(192, 'icon-192.png', { flatten: true });
  await png(512, 'icon-512.png', { flatten: true });

  // Apple touch icon: opaque square, no transparency (iOS requirement).
  await png(180, 'apple-touch-icon.png', { flatten: true });

  // Multi-resolution favicon.ico (16 + 32 + 48 embedded).
  const ico = await pngToIco([
    await sharp(iconSvg, { density: 384 }).resize(16, 16).png().toBuffer(),
    await sharp(iconSvg, { density: 384 }).resize(32, 32).png().toBuffer(),
    await sharp(iconSvg, { density: 384 }).resize(48, 48).png().toBuffer(),
  ]);
  writeFileSync(join(publicDir, 'favicon.ico'), ico);
  console.log('  ✓ favicon.ico (16/32/48)');

  // Open Graph / Twitter card image (1200x630).
  console.log('Generating social image...');
  const ogSvg = readFileSync(join(__dirname, 'og-source.svg'));
  await sharp(ogSvg, { density: 144 }).resize(1200, 630).png().toFile(join(publicDir, 'og-image.png'));
  console.log('  ✓ og-image.png (1200x630)');

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
