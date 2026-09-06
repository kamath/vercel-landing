// Tiny static server for dist/ so the preview page can be opened in a browser.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.otf': 'font/otf', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT ?? 4173);

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const file = join(root, normalize(url.pathname === '/' ? '/preview.html' : url.pathname));
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
