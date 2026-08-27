import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import server from './server/src/secure-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, 'client', 'dist');
const originalRequestHandlers = server.listeners('request');
const expressHandler = originalRequestHandlers[0] as ((req: any, res: any) => void) | undefined;

if (expressHandler) {
  server.removeAllListeners('request');

  server.on('request', (req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(requestUrl.pathname);

    // Let the Express API and Socket.IO handshake pass through unchanged.
    if (pathname.startsWith('/api/') || pathname.startsWith('/socket.io/')) {
      expressHandler(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      expressHandler(req, res);
      return;
    }

    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const candidate = path.resolve(clientDist, relativePath);
    const insideDist = candidate === clientDist || candidate.startsWith(`${clientDist}${path.sep}`);

    if (insideDist && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const contentType = getContentType(candidate);
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(candidate).pipe(res);
      return;
    }

    // SPA fallback for client-side routes.
    const indexFile = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(indexFile).pipe(res);
      return;
    }

    expressHandler(req, res);
  });
}

if (!server.listening) {
  server.listen(process.env.PORT || 3000);
}

function getContentType(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.mp3': return 'audio/mpeg';
    case '.mp4': return 'video/mp4';
    case '.woff': return 'font/woff';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}
