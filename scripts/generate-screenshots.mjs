import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'src', 'assets', 'pwa', 'screenshots');

const screenshots = [
  {
    name: 'mobile-dashboard.png',
    svg: resolve(__dirname, 'screenshots', 'mobile-dashboard.svg'),
    width: 390,
    height: 844,
  },
  {
    name: 'mobile-workout.png',
    svg: resolve(__dirname, 'screenshots', 'mobile-workout.svg'),
    width: 390,
    height: 844,
  },
  {
    name: 'desktop-dashboard.png',
    svg: resolve(__dirname, 'screenshots', 'desktop-dashboard.svg'),
    width: 1280,
    height: 720,
  },
  {
    name: 'desktop-metrics.png',
    svg: resolve(__dirname, 'screenshots', 'desktop-metrics.svg'),
    width: 1280,
    height: 720,
  },
];

async function main() {
  console.log('Generating PWA screenshots...\n');

  for (const shot of screenshots) {
    const buf = await sharp(shot.svg, { density: 300 })
      .resize(shot.width, shot.height)
      .png()
      .toBuffer();

    const outPath = resolve(OUT, shot.name);
    await sharp(buf).toFile(outPath);
    console.log(`  ✓ ${shot.name} (${shot.width}x${shot.height})`);
  }

  console.log('\n✨ All screenshots generated in src/assets/pwa/screenshots/');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
