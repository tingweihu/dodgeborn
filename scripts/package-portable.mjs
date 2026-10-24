import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { resolve, join, sep } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const release = resolve(root, 'release');
const portable = resolve(release, 'portable');
const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Unexpected package version');
const zip = resolve(release, `DODGEBORN-${version}-portable-preview.zip`);
for (const path of [release, portable, zip]) {
  if (!path.startsWith(root + sep)) throw new Error(`Package path leaves workspace: ${path}`);
}

const sources = [
  'packages/shared/src/index.ts',
  'packages/content/src/index.ts',
  'packages/core/src/index.ts',
  'apps/web/src/art.ts',
  'apps/web/src/music.ts',
  'apps/web/src/main.ts'
];
const parts = [];
for (const source of sources) {
  let code = stripTypeScriptTypes(await readFile(resolve(root, source), 'utf8'));
  code = code.replace(/^import[^\n]*;\r?\n/gm, '');
  code = code.replace(/^export (?=(?:const|function|class)\b)/gm, '');
  if (/^\s*(?:import|export)\b/m.test(code)) throw new Error(`Unbundled module statement in ${source}`);
  parts.push(`// ${source}\n${code}`);
}
const script = `(() => {\n'use strict';\n${parts.join('\n')}\n})();`;
if (/<\/script/i.test(script)) throw new Error('Inline script contains a closing script tag');
const style = await readFile(resolve(root, 'apps/web/src/style.css'), 'utf8');
if (/<\/style/i.test(style)) throw new Error('Inline style contains a closing style tag');
const digest = (value, encoding = 'hex') => createHash('sha256').update(value).digest(encoding);
const csp = [
  "default-src 'none'",
  `script-src 'sha256-${digest(script, 'base64')}'`,
  `style-src 'sha256-${digest(style, 'base64')}'`,
  "connect-src 'none'",
  "img-src data:",
  "font-src 'none'",
  "media-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ');
const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="theme-color" content="#182334">
  <title>DODGEBORN — 離線街機躲避球</title>
  <style>${style}</style>
</head>
<body>
  <main id="stage"><canvas id="game" width="480" height="270" tabindex="0" aria-label="DODGEBORN 遊戲畫面"></canvas></main>
  <script>${script}</script>
</body>
</html>
`;
if (/https?:\/\//i.test(html)) throw new Error('Portable HTML contains an external URL');
const readme = `DODGEBORN — 離線可攜預覽版 ${version}

Windows 10/11：先解壓整個 ZIP，再雙擊 DODGEBORN.html，使用 Microsoft Edge 或 Google Chrome 遊玩。
這是免安裝可攜版，不需要管理員權限、帳號、Node.js 或網路；不會寫入系統設定。
請勿將壓縮包內的檔案移入不明來源的安裝程式中。遊戲沒有自動更新、遠端連線或資料上傳。

操作：P1 使用 WASD 移動、左 Shift 衝刺、R 跳躍、F 投球、G 接球、Q 閃避、E 傳球。
雙人模式 P2 使用方向鍵移動、右 Shift 衝刺、I 跳躍、K 投球、L 接球、O 閃避、U 傳球。
助跑後跳起出手可發動必殺；Esc 暫停。M 可開關原創背景音樂。遊戲只支援桌面鍵盤。

檔案驗證：在 PowerShell 執行 Get-FileHash .\\DODGEBORN.html -Algorithm SHA256，
與 SHA256SUMS.txt 中的 DODGEBORN.html 雜湊值比較。

本版仍是 Canvas 2D 預覽版；尚未完成正式 TypeScript/Vite/Vitest 工具鏈與跨瀏覽器驗收。
原始碼授權 MIT；原創程序化美術、背景音樂與合成音效授權 CC0-1.0。
`;
const assetLicenses = `DODGEBORN 素材授權

原創程序化角色、球場、介面、特效、背景音樂與 Web Audio 合成音效：CC0-1.0。
遊戲程式碼：MIT，見 LICENSE。
本可攜包沒有第三方圖片、音樂、字型或 npm 套件；使用使用者系統內建字型。
`;
await mkdir(portable, { recursive: true });
const files = new Map([
  ['DODGEBORN.html', html],
  ['README.txt', readme],
  ['LICENSE', await readFile(resolve(root, 'LICENSE'), 'utf8')],
  ['ASSET_LICENSES.txt', assetLicenses]
]);
for (const [name, contents] of files) await writeFile(join(portable, name), contents, 'utf8');
const checksums = [...files].map(([name, contents]) => `${digest(contents)}  ${name}`).join('\n') + '\n';
await writeFile(join(portable, 'SHA256SUMS.txt'), checksums, 'utf8');
const allowed = new Set([...files.keys(), 'SHA256SUMS.txt']);
const unexpected = (await readdir(portable)).filter(name => !allowed.has(name));
if (unexpected.length) throw new Error(`Unexpected file in portable package: ${unexpected.join(', ')}`);
if (process.platform !== 'win32') throw new Error('ZIP creation currently requires Windows PowerShell');
const quote = path => path.replaceAll("'", "''");
await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
  `Compress-Archive -Path '${quote(join(portable, '*'))}' -DestinationPath '${quote(zip)}' -Force -ErrorAction Stop`
], { cwd: root });
const zipHash = digest(await readFile(zip));
await writeFile(`${zip}.sha256`, `${zipHash}  ${zip.split(/[\\/]/).at(-1)}\n`, 'utf8');
console.log(`Portable ZIP: ${zip} (${(await stat(zip)).size} bytes)`);
console.log(`SHA-256: ${zipHash}`);
