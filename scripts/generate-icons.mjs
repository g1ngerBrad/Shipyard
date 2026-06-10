import sharp from 'sharp';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const INK = '#0f172a';

const faviconInner = fs
  .readFileSync(join(pub, 'favicon.svg'), 'utf8')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .trim();

const bloomDefs = `
  <radialGradient id="bloom" cx="0.5" cy="0.3" r="0.8">
    <stop offset="0" stop-color="#C266E0" stop-opacity="0.42"/>
    <stop offset="0.55" stop-color="#7C3AED" stop-opacity="0.14"/>
    <stop offset="1" stop-color="#C266E0" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="bloom2" cx="0.12" cy="0.95" r="0.6">
    <stop offset="0" stop-color="#F472D0" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#F472D0" stop-opacity="0"/>
  </radialGradient>`;

const onDark = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <defs>${bloomDefs}</defs>
  <rect width="512" height="512" fill="${INK}"/>
  <rect width="512" height="512" fill="url(#bloom)"/>
  <rect width="512" height="512" fill="url(#bloom2)"/>
  ${faviconInner}
</svg>`;

const svg = Buffer.from(onDark);

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-96x96.png', size: 96 },
];

for (const { file, size } of targets) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(pub, file));
  console.log('wrote', file, `(${size}x${size})`);
}
