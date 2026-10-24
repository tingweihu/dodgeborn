import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createRequire, stripTypeScriptTypes } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch {
  const modulePath = process.env.DODGEBORN_PLAYWRIGHT_MODULE;
  if (!modulePath) throw new Error('Playwright unavailable: install dependencies or set DODGEBORN_PLAYWRIGHT_MODULE');
  ({ chromium } = require(resolve(modulePath)));
}
const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'test-results');
const built = process.argv.includes('--built');
await mkdir(out, { recursive: true });

const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ headless: true, ...(existsSync(chromePath) ? { executablePath: chromePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('http://dodgeborn.test/**', async route => {
  const url = new URL(route.request().url());
  let path = url.pathname;
  if (built) {
    if (path === '/') path = '/dist/index.html';
    else path = '/dist' + path;
  } else {
    if (path === '/') path = '/apps/web/index.html';
    else if (path.startsWith('/src/')) path = '/apps/web' + path;
  }
  const full = resolve(root, '.' + path);
  if (full !== root && !full.startsWith(root + sep)) return route.fulfill({ status: 403, body: 'Forbidden' });
  try {
    const ext = extname(full);
    let body = await readFile(full, 'utf8');
    if (ext === '.ts') body = stripTypeScriptTypes(body);
    return route.fulfill({ status: 200, body, contentType: ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : 'text/javascript' });
  } catch { return route.fulfill({ status: 404, body: 'Not found' }); }
});

try {
  await page.goto('http://dodgeborn.test/?test=1');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'menu');
  await page.screenshot({ path: resolve(out, 'menu.png') });
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'select');
  await page.screenshot({ path: resolve(out, 'select.png') });
  await page.keyboard.press('KeyZ');
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).difficulty, 'hard');
  await page.keyboard.press('KeyZ');
  await page.keyboard.press('KeyZ');
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).difficulty, 'normal');
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
  await page.screenshot({ path: resolve(out, 'match.png') });
  const during = await page.evaluate(() => window.__DODGEBORN__.getState());
  assert.ok(during.tick >= 26);
  assert.ok(during.specialsThrown >= 1, JSON.stringify(during));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'pause');
  const paused = await page.evaluate(() => window.__DODGEBORN__.getState().tick);
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => window.__DODGEBORN__.getState().tick), paused);
  const box = await page.locator('#game').boundingBox();
  assert.ok(box);
  await page.mouse.click(box.x + box.width * 240 / 480, box.y + box.height * 162 / 270);
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'match');
  assert.ok((await page.evaluate(() => window.__DODGEBORN__.getState().tick)) < 4);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'match');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Backspace');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'menu');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'select');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'select');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-screen'), 'match');
  assert.equal((await page.evaluate(() => window.__DODGEBORN__.getState())).mode, 'versus');
  const p2Before = await page.evaluate(() => window.__DODGEBORN__.getState().control[1].x);
  await page.keyboard.down('ArrowLeft');
  await page.evaluate(() => window.__DODGEBORN__.advance(15));
  await page.keyboard.up('ArrowLeft');
  const p2After = await page.evaluate(() => window.__DODGEBORN__.getState().control[1].x);
  assert.ok(p2After < p2Before);
  await page.evaluate(() => window.__DODGEBORN__.start('solo', true));
  await page.evaluate(() => window.__DODGEBORN__.advance(11_000));
  const complete = await page.evaluate(() => window.__DODGEBORN__.getState());
  assert.equal(complete.finished, true);
  assert.equal(complete.screen, 'result');
  await page.screenshot({ path: resolve(out, 'result.png') });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ menu: 'PASS', match: 'PASS', pause: 'PASS', versus: 'PASS', fullMatch: 'PASS', complete, errors }, null, 2));
} finally { await browser.close(); }
