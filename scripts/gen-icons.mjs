import sharp from 'sharp';
import { writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');
const SPLASH = resolve(PUBLIC, 'splash');
const BG = '#0f172a';

const SRC = process.argv[2] ? resolve(process.argv[2]) : resolve(ROOT, 'scripts/source-logo.png');

const CROP = { left: 0, top: 0, size: 1 };

async function loadCroppedSquare() {
  const meta = await sharp(SRC).metadata();
  const min = Math.min(meta.width, meta.height);
  const side = Math.round(min * CROP.size);
  const left = Math.round(meta.width * CROP.left);
  const top = Math.round(meta.height * CROP.top);
  return sharp(SRC).extract({ left, top, width: side, height: side }).png().toBuffer();
}

async function makeIcon(square, size, outName) {
  await sharp(square).resize(size, size, { fit: 'cover' }).png().toFile(resolve(PUBLIC, outName));
  console.log('  ✓', outName, `${size}x${size}`);
}

async function makeMaskable(square, size, outName) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(square).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(resolve(PUBLIC, outName));
  console.log('  ✓', outName, `${size}x${size} (maskable)`);
}

function gradientSvg(w, h, glow) {
  const g1 = { cx: 0.5 * w, cy: -0.12 * h, rx: 1.25 * w, ry: 0.8 * h, stop: 0.6, color: '194,102,224', a: 0.2 };
  const g2 = { cx: 1.0 * w, cy: 0.0 * h, rx: 0.9 * w, ry: 0.6 * h, stop: 0.55, color: '56,189,248', a: 0.12 };
  const radial = (id, g) => `
    <radialGradient id="${id}" gradientUnits="userSpaceOnUse"
      cx="${g.cx}" cy="${g.cy}" r="${g.rx}"
      gradientTransform="translate(${g.cx} ${g.cy}) scale(1 ${g.ry / g.rx}) translate(${-g.cx} ${-g.cy})">
      <stop offset="0" stop-color="rgb(${g.color})" stop-opacity="${g.a}"/>
      <stop offset="${g.stop}" stop-color="rgb(${g.color})" stop-opacity="0"/>
    </radialGradient>`;
  const glowDef = `
    <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx="${glow.cx}" cy="${glow.cy}" r="${glow.r}">
      <stop offset="0" stop-color="rgb(56,189,248)" stop-opacity="0.3"/>
      <stop offset="0.4" stop-color="rgb(56,189,248)" stop-opacity="0.16"/>
      <stop offset="1" stop-color="rgb(56,189,248)" stop-opacity="0"/>
    </radialGradient>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>${radial('a', g1)}${radial('b', g2)}${glowDef}</defs>
      <rect width="${w}" height="${h}" fill="${BG}"/>
      <rect width="${w}" height="${h}" fill="url(#a)"/>
      <rect width="${w}" height="${h}" fill="url(#b)"/>
      <rect width="${w}" height="${h}" fill="url(#glow)"/>
    </svg>`
  );
}

async function makeSplash(square, w, h, outName) {
  const logoSize = Math.round(Math.min(w, h) * 0.3);
  const glow = { cx: w / 2, cy: h / 2, r: logoSize * 1.35 };
  const logo = await sharp(square).resize(logoSize, logoSize, { fit: 'cover' }).png().toBuffer();
  await sharp(gradientSvg(w, h, glow))
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(resolve(SPLASH, outName));
}

async function main() {
  const square = await loadCroppedSquare();
  console.log('Icons:');
  await makeIcon(square, 192, 'pwa-192x192.png');
  await makeIcon(square, 512, 'pwa-512x512.png');
  await makeMaskable(square, 512, 'pwa-512x512-maskable.png');
  await makeIcon(square, 180, 'apple-touch-icon.png');
  await makeIcon(square, 96, 'favicon-96x96.png');

  const fav = await sharp(square).resize(96, 96, { fit: 'cover' }).png().toBuffer();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><image width="96" height="96" href="data:image/png;base64,${fav.toString('base64')}"/></svg>`;
  writeFileSync(resolve(PUBLIC, 'favicon.svg'), svg);
  console.log('  ✓ favicon.svg (embedded raster)');

  const splashes = readdirSync(SPLASH).filter((f) => /^apple-splash-\d+-\d+\.png$/.test(f));
  console.log(`Splash screens (${splashes.length}):`);
  for (const f of splashes) {
    const [, w, h] = f.match(/apple-splash-(\d+)-(\d+)\.png/);
    await makeSplash(square, Number(w), Number(h), f);
  }
  console.log('  ✓ all splash screens regenerated');
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
