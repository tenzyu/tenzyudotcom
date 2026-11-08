import http from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../product/apps/web/package.json', import.meta.url));
const { WebSocket, WebSocketServer } = require('next/dist/compiled/ws');

const pages = /^(?:\/(?:en\/)?(?:links|tools|blog|notes|scraps|osu|portfolio)(?:\/[a-zA-Z0-9_-]+)*\/?|\/(?:en\/?|))$/;
const assets = /^\/(?:_next\/static|fonts|images|icons)\/[a-zA-Z0-9_./~@()[\]-]+$/;
const imageHosts = new Set(['img.youtube.com', 'pbs.twimg.com', 'assets.ppy.sh']);

function isAllowedImage(url) {
  if (url.pathname !== '/_next/image' || url.searchParams.getAll('url').length !== 1) return false;
  try {
    const image = new URL(url.searchParams.get('url'), 'http://localhost');
    return (image.origin === 'http://localhost' && /^\/images\/[a-zA-Z0-9_./-]+$/.test(image.pathname)) ||
      (image.protocol === 'https:' && !image.port && imageHosts.has(image.hostname));
  } catch {
    return false;
  }
}

export function createPreviewGate(upstreamPort) {
  const server = http.createServer((request, response) => {
    let url;
    try {
      url = new URL(request.url, 'http://localhost');
    } catch {
      response.writeHead(400).end();
      return;
    }
    let decodedPath;
    try {
      decodedPath = url.pathname.split('/').map((segment) => {
        const decoded = decodeURIComponent(segment);
        if (decoded === '.' || decoded === '..' || /[/\\\0]/.test(decoded)) throw new Error('Invalid path');
        return decoded;
      }).join('/');
    } catch {
      response.writeHead(403).end('Denied');
      return;
    }
    if (!['GET', 'HEAD'].includes(request.method) || request.url.startsWith('//') ||
        !(pages.test(decodedPath) || assets.test(decodedPath) || isAllowedImage(url) || decodedPath === '/favicon.ico' || decodedPath === '/header-background.webm') ||
        request.headers['next-action'] || request.headers['x-middleware-subrequest'] ||
        request.headers['transfer-encoding'] || Number(request.headers['content-length'] || 0) !== 0) {
      response.writeHead(403).end('Denied');
      return;
    }
    const headers = { host: `127.0.0.1:${upstreamPort}` };
    for (const name of ['accept', 'accept-language', 'cookie', 'rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-url']) {
      if (request.headers[name]) headers[name] = request.headers[name];
    }
    const upstream = http.request({ hostname: '127.0.0.1', port: upstreamPort, path: `${url.pathname}${url.search}`, method: request.method, headers }, (result) => {
      response.writeHead(result.statusCode ?? 502, result.headers);
      result.pipe(response);
    });
    upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end(); });
    upstream.end();
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 8192 });
  server.on('upgrade', (request, socket, head) => {
    let url;
    try {
      url = new URL(request.url, 'http://localhost');
      if (new URL(request.headers.origin).host !== request.headers.host) throw new Error('Origin mismatch');
    } catch {
      socket.destroy();
      return;
    }
    if (url.pathname !== '/_next/webpack-hmr' || !/^[a-zA-Z0-9_-]{1,100}$/.test(url.searchParams.get('id') ?? '')) {
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(request, socket, head, (client) => {
      const next = new WebSocket(`ws://127.0.0.1:${upstreamPort}${url.pathname}${url.search}`);
      const pending = [];
      next.on('open', () => { for (const data of pending) next.send(data); pending.length = 0; });
      next.on('message', (data, binary) => { if (client.readyState === WebSocket.OPEN) client.send(data, { binary }); });
      client.on('message', (data, binary) => {
        if (binary) return;
        try {
          const message = JSON.parse(data.toString());
          const safe = message.event === 'ping' ? { event: 'ping' } :
            ['turbopack-subscribe', 'turbopack-unsubscribe'].includes(message.type) && typeof message.path === 'string' && message.path.length <= 1024 ? { type: message.type, path: message.path } : null;
          if (safe) {
            const sanitized = JSON.stringify(safe);
            if (next.readyState === WebSocket.OPEN) next.send(sanitized);
            else if (next.readyState === WebSocket.CONNECTING && pending.length < 32) pending.push(sanitized);
            else client.close(1008);
          }
        } catch {
          client.close(1008);
        }
      });
      next.on('error', () => client.close());
      next.on('close', () => client.close());
      client.on('error', () => next.close());
      client.on('close', () => next.close());
    });
  });
  return server;
}
