import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const release = resolve(root, 'release');
const source = resolve(release, 'open-source-candidate');
const zip = resolve(release, 'DODGEBORN-0.1.0-source-preview.zip');
for (const target of [release, source, zip]) {
  if (!target.startsWith(root + sep)) throw new Error(`Export path leaves workspace: ${target}`);
}
if (existsSync(source) || existsSync(zip)) throw new Error('Open-source candidate already exists; inspect it before preparing another');
if (process.platform !== 'win32') throw new Error('Source ZIP creation currently requires Windows PowerShell');

// Export a fresh source tree without the local Git history, caches, build products, or credentials.
const roots = [
  '.gitignore', 'README.md', 'README.en.md', 'README.ja.md',
  'LICENSE', 'CONTRIBUTING.md', 'SECURITY.md',
  'package.json', 'tsconfig.json', 'vitest.config.ts', 'playwright.config.ts', 'vercel.json',
  '.github', 'apps', 'packages', 'scripts', 'tests', 'docs'
];
const textExtensions = new Set(['.md', '.mjs', '.ts', '.json', '.html', '.css', '.yml', '.yaml']);
const pathOrSecret = [
  /[A-Za-z]:\\(?:dev|Users)\\/i,
  /[A-Za-z]:\/dev\//i,
  /\/Users\//i,
  new RegExp('USER' + 'PROFILE', 'i'),
  new RegExp('codex' + '-runtimes', 'i'),
  /(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i
];
const copied = [];

async function copySafe(path) {
  const from = resolve(root, path);
  if (from !== root && !from.startsWith(root + sep)) throw new Error(`Source path leaves workspace: ${path}`);
  const info = await lstat(from);
  if (info.isSymbolicLink()) throw new Error(`Symlink is not allowed in source export: ${path}`);
  if (info.isDirectory()) {
    for (const name of await readdir(from)) {
      if (name.startsWith('.') && path !== '.github') throw new Error(`Unexpected hidden source item: ${join(path, name)}`);
      await copySafe(join(path, name));
    }
    return;
  }
  if (!info.isFile() || info.size > 2_000_000) throw new Error(`Unexpected source file: ${path}`);
  const extension = extname(path).toLowerCase();
  if (extension !== '.png' && !textExtensions.has(extension) && !['.gitignore', 'LICENSE'].includes(path)) {
    throw new Error(`Unexpected source format: ${path}`);
  }
  const bytes = await readFile(from);
  if (extension !== '.png' && pathOrSecret.some(pattern => pattern.test(bytes.toString('utf8')))) {
    throw new Error(`Machine path or credential marker in source: ${path}`);
  }
  if (extension === '.png' && !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error(`Invalid PNG: ${path}`);
  }
  const to = resolve(source, path);
  if (!to.startsWith(source + sep)) throw new Error(`Export destination leaves source tree: ${path}`);
  await mkdir(dirname(to), { recursive: true });
  await copyFile(from, to);
  copied.push({ path: relative(root, from).replaceAll('\\', '/'), sha256: createHash('sha256').update(bytes).digest('hex') });
}

await mkdir(source, { recursive: true });
for (const path of roots) await copySafe(path);
copied.sort((a, b) => a.path.localeCompare(b.path, 'en'));
const quote = value => value.replaceAll("'", "''");
await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
  `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::CreateFromDirectory('${quote(source)}','${quote(zip)}',[IO.Compression.CompressionLevel]::Optimal,$false)`
], { cwd: root });
const hash = createHash('sha256').update(await readFile(zip)).digest('hex');
await writeFile(`${zip}.sha256`, `${hash}  ${zip.split(/[\\/]/).at(-1)}\n`, 'utf8');
await writeFile(resolve(release, 'open-source-candidate-manifest.json'), JSON.stringify(copied, null, 2) + '\n', 'utf8');
console.log(`Clean source: ${source}`);
console.log(`Source files: ${copied.length}`);
console.log(`Source ZIP: ${zip} (${(await stat(zip)).size} bytes)`);
console.log(`SHA-256: ${hash}`);
