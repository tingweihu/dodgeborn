import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const root = resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.ts': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/apps/web/index.html';
    else if (pathname.startsWith('/src/')) pathname = '/apps/web' + pathname;
    const file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403); response.end('Forbidden'); return; }
    if (!(await stat(file)).isFile()) { response.writeHead(404); response.end('Not found'); return; }
    const ext = extname(file);
    let data = await readFile(file);
    if (ext === '.ts') data = Buffer.from(stripTypeScriptTypes(data.toString('utf8')));
    response.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(data);
  } catch {
    response.writeHead(404); response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`DODGEBORN local server: http://127.0.0.1:${port}`));
