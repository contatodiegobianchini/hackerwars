import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import server from './secure-server.js';

// Single-process entrypoint: serves the built React client (client/dist) together
// with the Express API and Socket.IO. Used by ShardCloud (see .shardcloud).
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '..', '..', 'client', 'dist');
const indexFile = path.join(clientDist, 'index.html');
const upstream = server.listeners('request')[0] as ((req: any, res: any) => void) | undefined;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
};

if (!fs.existsSync(indexFile)) {
  console.warn(`[serve-client] ${indexFile} not found - only the API will be served. Run "npm run build" first.`);
} else if (upstream) {
  server.removeAllListeners('request');
  server.on('request', (req: any, res: any) => {
    let pathname = '/';
    try { pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname); } catch { /* fall through */ }
    const isRead = req.method === 'GET' || req.method === 'HEAD';
    if (!isRead || pathname.startsWith('/api/') || pathname.startsWith('/socket.io/')) return upstream(req, res);

    const candidate = path.resolve(clientDist, pathname.replace(/^\/+/, '') || 'index.html');
    const inside = candidate.startsWith(clientDist + path.sep);
    const isFile = inside && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
    const file = isFile ? candidate : indexFile; // SPA fallback
    res.statusCode = 200;
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

export default server;
