import sharp from 'sharp';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SVG_PATH = resolve(__dirname, 'logo-master.svg');
const OUT_DIR = resolve(ROOT, 'public', 'icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [
  { size: 192, padding: 28 },
  { size: 512, padding: 74 },
];

const FAVICON_SIZES = [16, 32, 48];
const APPLE_TOUCH = 180;

const BACKGROUND = '#0f0f13';
const LOGO_SIZE = 1024;

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

function calc(i) {
  return LOGO_SIZE / 2;
}

async function renderSvg(size, opts = {}) {
  const { background, padding = 0 } = opts;
  let pipeline = sharp(SVG_PATH, { density: 300 });

  if (padding > 0) {
    // Render larger, then composite onto a padded canvas
    const scale = (size - padding * 2) / size;
    const innerSize = Math.round(size * scale);
    const buffer = await pipeline
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    const padded = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background,
      },
    })
      .composite([
        {
          input: buffer,
          top: Math.round((size - innerSize) / 2),
          left: Math.round((size - innerSize) / 2),
        },
      ])
      .png()
      .toBuffer();

    return padded;
  }

  if (background) {
    const buffer = await pipeline
      .resize(size, size)
      .flatten({ background })
      .png()
      .toBuffer();
    return buffer;
  }

  return await pipeline.resize(size, size).png().toBuffer();
}

async function renderFaviconPng(size) {
  // Favicons need to be sharp at small sizes — use the background
  return await renderSvg(size, { background: BACKGROUND });
}

async function renderAppleTouch() {
  return await renderSvg(APPLE_TOUCH, { background: BACKGROUND });
}

async function main() {
  console.log('Generating PWA assets from logo-master.svg...\n');

  // Standard icons
  for (const size of SIZES) {
    const buf = await renderSvg(size, { background: BACKGROUND });
    const filename = `icon-${size}x${size}.png`;
    writeFileSync(resolve(OUT_DIR, filename), buf);
    console.log(`  ✓ ${filename} (${size}x${size})`);
  }

  // Maskable icons (with safe zone padding)
  for (const { size, padding } of MASKABLE_SIZES) {
    const buf = await renderSvg(size, {
      background: BACKGROUND,
      padding,
    });
    const filename = `maskable-icon-${size}x${size}.png`;
    writeFileSync(resolve(OUT_DIR, filename), buf);
    console.log(`  ✓ ${filename} (${size}x${size}, padding ${padding}px)`);
  }

  // Apple touch icon
  const appleBuf = await renderAppleTouch();
  writeFileSync(resolve(OUT_DIR, 'apple-touch-icon.png'), appleBuf);
  console.log(`  ✓ apple-touch-icon.png (${APPLE_TOUCH}x${APPLE_TOUCH})`);

  // Favicon PNGs
  for (const size of FAVICON_SIZES) {
    const buf = await renderFaviconPng(size);
    const filename = `favicon-${size}x${size}.png`;
    writeFileSync(resolve(OUT_DIR, filename), buf);
    console.log(`  ✓ ${filename} (${size}x${size})`);
  }

  // Favicon ICO — use 32x32 PNG as a standalone favicon
  // (modern browsers support PNG favicons natively)
  const faviconBuf = await renderFaviconPng(32);
  writeFileSync(resolve(ROOT, 'public', 'favicon.ico'), faviconBuf);
  console.log('  ✓ favicon.ico (32x32 PNG)');

  console.log('\n✨ All assets generated in public/icons/');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
