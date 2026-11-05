import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([['/', ['index.html','text/html; charset=utf-8']], ['/app.js',['app.js','text/javascript; charset=utf-8']], ['/metrics.js',['metrics.js','text/javascript; charset=utf-8']], ['/style.css',['style.css','text/css; charset=utf-8']]]);
http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname; const entry = files.get(path);
  if (!entry) { res.writeHead(404); return res.end('Not found'); }
  try { const data = await readFile(new URL(`./public/${entry[0]}`, import.meta.url)); res.writeHead(200, {'content-type':entry[1]}); res.end(data); }
  catch { res.writeHead(500); res.end('Unable to load file'); }
}).listen(4174, '127.0.0.1', () => console.log('Repository Pulse: http://127.0.0.1:4174'));
