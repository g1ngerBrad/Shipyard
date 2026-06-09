import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const INK = '#0f172a'; // slate-900 — matches the app background

const defs = `
  <linearGradient id="g" x1="80" y1="80" x2="432" y2="432" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#A855F7"/>
    <stop offset="0.55" stop-color="#C266E0"/>
    <stop offset="1" stop-color="#F472D0"/>
  </linearGradient>
  <!-- Purple bloom from the top, echoing the in-app ambient background. -->
  <radialGradient id="bloom" cx="0.5" cy="0.3" r="0.8">
    <stop offset="0" stop-color="#C266E0" stop-opacity="0.42"/>
    <stop offset="0.55" stop-color="#7C3AED" stop-opacity="0.14"/>
    <stop offset="1" stop-color="#C266E0" stop-opacity="0"/>
  </radialGradient>
  <!-- Faint pink bloom from the bottom-left for balance. -->
  <radialGradient id="bloom2" cx="0.12" cy="0.95" r="0.6">
    <stop offset="0" stop-color="#F472D0" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#F472D0" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
    <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="#C266E0" flood-opacity="0.55"/>
  </filter>`;

const mark = `
  <g filter="url(#glow)" stroke="url(#g)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M 197.9 96.2 A 170 170 0 1 1 96.2 197.9" stroke-width="40"/>
    <path d="M 162 258 L 228 326 L 356 188" stroke-width="44"/>
  </g>`;

const onDark = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <defs>${defs}</defs>
  <rect width="512" height="512" fill="${INK}"/>
  <rect width="512" height="512" fill="url(#bloom)"/>
  <rect width="512" height="512" fill="url(#bloom2)"/>${mark}
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
