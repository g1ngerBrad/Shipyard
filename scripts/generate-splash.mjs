import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Regenerates the iOS apple-touch-startup-images in public/splash with the
// current logo (public/favicon.svg) centred on the app's splash gradient.
//
// Needs a Chrome/Edge binary — set PUPPETEER_EXECUTABLE_PATH, e.g.
//   PUPPETEER_EXECUTABLE_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" \
//     node scripts/generate-splash.mjs

const exe = process.env.PUPPETEER_EXECUTABLE_PATH;
if (!exe) throw new Error('Set PUPPETEER_EXECUTABLE_PATH to a Chrome/Edge binary');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const splashDir = join(root, 'public', 'splash');

const svg = fs.readFileSync(join(root, 'public', 'favicon.svg'), 'utf8');
const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

// Splash gradient — kept in sync with the #splash rule in index.html.
const BG =
  'background-color:#0f172a;' +
  'background-image:' +
  'radial-gradient(125% 80% at 50% -12%, rgba(194,102,224,0.20), transparent 60%),' +
  'radial-gradient(90% 60% at 100% 0%, rgba(56,189,248,0.12), transparent 55%),' +
  'radial-gradient(100% 70% at 0% 100%, rgba(244,114,208,0.12), transparent 55%);' +
  'background-repeat:no-repeat;';

// Logo sized as a fraction of the shortest side, matching the previous splashes.
const LOGO_FRACTION = 0.2;

const targets = fs
  .readdirSync(splashDir)
  .filter((f) => /^apple-splash-\d+-\d+\.png$/.test(f))
  .map((file) => {
    const [, w, h] = file.match(/apple-splash-(\d+)-(\d+)\.png/);
    return { file, width: Number(w), height: Number(h) };
  });

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();

for (const t of targets) {
  await page.setViewport({ width: t.width, height: t.height, deviceScaleFactor: 1 });
  const logo = Math.round(Math.min(t.width, t.height) * LOGO_FRACTION);
  const html =
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
    `html,body{margin:0;padding:0;width:${t.width}px;height:${t.height}px}` +
    `body{display:flex;align-items:center;justify-content:center;${BG}}` +
    `img{width:${logo}px;height:${logo}px;display:block}` +
    `</style></head><body><img src="${dataUri}"></body></html>`;
  await page.goto('data:text/html;base64,' + Buffer.from(html).toString('base64'), {
    waitUntil: 'networkidle0',
  });
  await page.screenshot({ path: join(splashDir, t.file) });
  console.log(`wrote ${t.file} (${t.width}x${t.height}, logo ${logo}px)`);
}

await browser.close();
console.log(`done — ${targets.length} splash screens`);
