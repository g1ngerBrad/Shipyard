import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const exe = process.env.PUPPETEER_EXECUTABLE_PATH;
if (!exe) throw new Error('Set PUPPETEER_EXECUTABLE_PATH to a Chrome/Edge binary');

const svg = fs.readFileSync('public/favicon.svg', 'utf8');
const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

// Stylised app background (matches index.html body / splash screen).
const BG =
  'background-color:#0f172a;' +
  'background-image:' +
  'radial-gradient(125% 80% at 50% -12%, rgba(194,102,224,0.20), transparent 60%),' +
  'radial-gradient(90% 60% at 100% 0%, rgba(56,189,248,0.12), transparent 55%),' +
  'radial-gradient(100% 70% at 0% 100%, rgba(244,114,208,0.12), transparent 55%);' +
  'background-repeat:no-repeat;';

// All icons: stylised gradient background, mark rendered full-frame (pad 0)
// so it fills the icon like the original — the SVG viewBox already carries
// its own breathing room.
const pad = 0;
const targets = [
  { file: 'public/favicon-96x96.png', size: 96 },
  { file: 'public/pwa-192x192.png', size: 192 },
  { file: 'public/pwa-512x512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
];

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();

for (const t of targets) {
  await page.setViewport({ width: t.size, height: t.size, deviceScaleFactor: 1 });
  const inner = Math.round(t.size * (1 - 2 * pad));
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
    `html,body{margin:0;padding:0;width:${t.size}px;height:${t.size}px}` +
    `body{display:flex;align-items:center;justify-content:center;${BG}}` +
    `img{width:${inner}px;height:${inner}px;display:block}` +
    `</style></head><body><img src="${dataUri}"></body></html>`;
  await page.goto('data:text/html;base64,' + Buffer.from(html).toString('base64'), {
    waitUntil: 'networkidle0',
  });
  await page.screenshot({ path: t.file });
  console.log(`wrote ${t.file} (${t.size}x${t.size})`);
}

await browser.close();
console.log('done');
