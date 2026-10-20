// Minimal preview server for dist/, mounted under BASE like GitHub Pages.
//   BASE=/rasikh/ node src/build.mjs && BASE=/rasikh/ node src/serve.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { ROOT } from './validate.mjs';

const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');
const PORT = Number(process.env.PORT || 4321);
const DIST = join(ROOT, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain' };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (!path.startsWith(BASE)) {
    res.writeHead(302, { location: BASE });
    return res.end();
  }
  let file = normalize(join(DIST, path.slice(BASE.length)));
  if (!file.startsWith(DIST)) return res.writeHead(400).end();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end(await readFile(join(DIST, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}${BASE}`));
