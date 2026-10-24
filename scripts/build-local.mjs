import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
if (!output.startsWith(root + sep) || output === root) throw new Error('Build output must stay inside workspace');
await rm(output, { recursive: true, force: true });
const sources = [
  'apps/web/src/main.ts', 'apps/web/src/art.ts', 'apps/web/src/music.ts',
  'packages/core/src/index.ts', 'packages/content/src/index.ts', 'packages/shared/src/index.ts'
];
for (const source of sources) {
  const inFile = resolve(root, source);
  const target = source.startsWith('apps/web/src/') ? source.replace('apps/web/src/', 'src/') : source;
  const outFile = resolve(output, target.replace(/\.ts$/, '.js'));
  await mkdir(dirname(outFile), { recursive: true });
  let code = stripTypeScriptTypes(await readFile(inFile, 'utf8'));
  code = code.replace(/(from\s+['"][^'"]+)\.ts(['"])/g, '$1.js$2');
  if (source.startsWith('apps/web/src/')) code = code.replaceAll('../../../packages/', '../packages/');
  await writeFile(outFile, code, 'utf8');
}
await copyFile(resolve(root, 'apps/web/src/style.css'), resolve(output, 'src/style.css'));
const html = (await readFile(resolve(root, 'apps/web/index.html'), 'utf8'))
  .replaceAll('"/src/', '"./src/').replace('main.ts', 'main.js');
await writeFile(resolve(output, 'index.html'), html, 'utf8');
console.log(`Static build written to ${output}`);
