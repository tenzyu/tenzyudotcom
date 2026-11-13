import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { after, before, test } from 'node:test';
import { createPreviewGate } from './readonly-preview-gate.mjs';

const require = createRequire(new URL('../../product/apps/web/package.json', import.meta.url));
const { WebSocket, WebSocketServer } = require('next/dist/compiled/ws');
let upstream;
let gate;
let origin;
let calls = [];
let messages = [];

before(async () => {
  upstream = http.createServer((request, response) => {
    calls.push({ method: request.method, url: request.url, headers: request.headers });
    response.writeHead(200, { 'content-type': 'text/plain' }).end('preview');
  });
  const ws = new WebSocketServer({ noServer: true });
  upstream.on('upgrade', (request, socket, head) => ws.handleUpgrade(request, socket, head, (client) => {
    client.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
      client.send(data);
    });
  }));
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  gate = createPreviewGate(upstream.address().port);
  await new Promise((resolve) => gate.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${gate.address().port}`;
});

test('development websocket forwards pings but not arbitrary client events', async () => {
  messages = [];
  const socket = new WebSocket(`${origin.replace('http:', 'ws:')}/_next/webpack-hmr?id=abc`, { origin });
  await once(socket, 'open');
  socket.send(JSON.stringify({ event: 'client-file-logs', logs: ['unexpected'] }));
  socket.send(JSON.stringify({ event: 'ping', type: 'turbopack-subscribe', path: '/unexpected' }));
  await once(socket, 'message');
  assert.deepEqual(messages, [{ event: 'ping' }]);
  socket.close();
  await once(socket, 'close');
});

test('development websocket rejects a different browser origin', async () => {
  const socket = new WebSocket(`${origin.replace('http:', 'ws:')}/_next/webpack-hmr?id=abc`, { origin: 'https://untrusted.example' });
  await assert.rejects(once(socket, 'open'));
});
after(async () => {
  await Promise.all([new Promise((resolve) => gate.close(resolve)), new Promise((resolve) => upstream.close(resolve))]);
});

test('public pages and client assets reach the preview with query and locale cookies', async () => {
  calls = [];
  const page = await fetch(`${origin}/en/osu?view=tablet`, { headers: { cookie: 'INTLAYER_LOCALE=en', rsc: '1' } });
  assert.equal(await page.text(), 'preview');
  assert.equal(calls[0].url, '/en/osu?view=tablet');
  assert.equal(calls[0].headers.cookie, 'INTLAYER_LOCALE=en');
  assert.equal(calls[0].headers.rsc, '1');
  assert.equal((await fetch(`${origin}/_next/static/chunks/app.js`)).status, 200);
  assert.equal((await fetch(`${origin}/_next/static/chunks/%5Blocale%5D_%40scope_(main)~.js`)).status, 200);
  assert.equal((await fetch(`${origin}/_next/image?url=%2Fimages%2Fmy-icon.png&w=640&q=75`)).status, 200);
});

test('mutation methods, editor, internal routes, and action headers never reach Next', async () => {
  calls = [];
  for (const [path, options] of [
    ['/osu', { method: 'POST' }], ['/api/editor/notes', {}], ['/en/editor', {}],
    ['/_next/image?url=https://example.com', {}], ['/osu', { headers: { 'next-action': 'x' } }],
    ['/osu', { headers: { 'x-middleware-subrequest': 'x' } }], ['/tools/%2feditor', {}],
  ]) {
    assert.equal((await fetch(`${origin}${path}`, options)).status, 403, path);
  }
  assert.deepEqual(calls, []);
});
