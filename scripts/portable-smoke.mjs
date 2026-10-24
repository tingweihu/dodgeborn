import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  const modulePath = process.env.DODGEBORN_PLAYWRIGHT_MODULE;
  if (!modulePath) throw new Error('Playwright unavailable: install dependencies or set DODGEBORN_PLAYWRIGHT_MODULE');
  ({ chromium } = require(resolve(modulePath)));
}
const root = resolve(import.meta.dirname, '..');
const html = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(root, 'release/portable/DODGEBORN.html');
if (!html.startsWith(root + sep)) throw new Error('Portable smoke target must stay in the workspace');
if (!existsSync(html)) throw new Error(`Portable HTML missing: ${html}`);
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.setOffline(true);
const page = await context.newPage();
const errors = [];
const networkRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (!request.url().startsWith('file:') && !request.url().startsWith('data:')) networkRequests.push(request.url());
});
try {
  await page.goto(`${pathToFileURL(html).href}?test=1`);
  await page.waitForTimeout(200);
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'menu');
  assert.equal(await page.evaluate(() => document.styleSheets.length), 1);
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).music.playing, false);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'select');
  await page.waitForFunction(() => window.__DODGEBORN__.getState().music.scheduled > 0);
  await page.keyboard.press('KeyM');
  assert.equal(await page.locator('body').getAttribute('data-music'), 'off');
  const mutedCount = (await page.evaluate(() => window.__DODGEBORN__.getState())).music.scheduled;
  await page.waitForTimeout(260);
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).music.scheduled, mutedCount);
  await page.keyboard.press('KeyM');
  assert.equal(await page.locator('body').getAttribute('data-music'), 'on');
  await page.waitForFunction(count => window.__DODGEBORN__.getState().music.scheduled > count, mutedCount);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'match');
  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.__DODGEBORN__.advance(22));
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyR');
  await page.evaluate(() => window.__DODGEBORN__.advance(1));
  await page.keyboard.up('KeyR');
  await page.evaluate(() => window.__DODGEBORN__.advance(2));
  await page.keyboard.down('KeyF');
  await page.evaluate(() => window.__DODGEBORN__.advance(1));
  await page.keyboard.up('KeyF');
  assert.ok((await page.evaluate(() => window.__DODGEBORN__.getState())).specialsThrown >= 1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'pause');
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).music.playing, false);
  await page.evaluate(() => window.__DODGEBORN__.restart());
  assert.ok((await page.evaluate(() => window.__DODGEBORN__.getState())).tick < 4);
  await page.evaluate(() => { window.__DODGEBORN__.start('versus'); window.__DODGEBORN__.advance(2); });
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).mode, 'versus');
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowLeft');
  const before = await page.evaluate(() => window.__DODGEBORN__.getState().control);
  await page.evaluate(() => window.__DODGEBORN__.advance(15));
  const after = await page.evaluate(() => window.__DODGEBORN__.getState().control);
  await page.keyboard.up('KeyD');
  await page.keyboard.up('ArrowLeft');
  assert.ok(after[0].x > before[0].x && after[1].x < before[1].x);
  await page.evaluate(() => { window.__DODGEBORN__.start('solo', true); window.__DODGEBORN__.advance(11_000); });
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).screen, 'result');
  assert.deepEqual(errors, []);
  assert.deepEqual(networkRequests, []);
  console.log(JSON.stringify({ file: html, menu: 'PASS', music: 'PASS', mute: 'PASS', match: 'PASS', special: 'PASS', pause: 'PASS', restart: 'PASS', versus: 'PASS', fullMatch: 'PASS', offline: 'PASS', networkRequests: 0, errors: 0 }, null, 2));
} finally {
  await browser.close();
}
