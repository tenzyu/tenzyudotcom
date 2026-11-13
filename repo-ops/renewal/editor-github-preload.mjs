import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(new URL('../../product/apps/web/package.json', import.meta.url));
const nextEnv = require('@next/env');
require.cache[require.resolve('@next/env')].exports = {
  ...nextEnv,
  loadEnvConfig: () => ({ combinedEnv: process.env, parsedEnv: {}, loadedEnvFiles: [] }),
};

const blobs = new Map();
const trees = new Map();
const commits = new Map();
const sha = (value) => createHash('sha1').update(JSON.stringify(value)).digest('hex');
const storeBlob = (content) => {
  const id = sha(content);
  blobs.set(id, content);
  return id;
};
const initialTree = { 'storage/scraps/index.json': storeBlob('[]\n') };
const initialTreeId = sha(initialTree);
trees.set(initialTreeId, initialTree);
let head = sha({ tree: initialTreeId, parents: [] });
commits.set(head, { tree: { sha: initialTreeId }, parents: [] });
const ledger = process.env.EDITOR_FIXTURE_LEDGER;
if (!ledger) throw new Error('EDITOR_FIXTURE_LEDGER is required');
const prefix = '/repos/fixture/editor';

function fixture(url, method, body) {
  const path = decodeURIComponent(url.pathname.slice(prefix.length));
  if (method === 'GET' && path === '/git/ref/heads/main')
    return [200, { object: { sha: head } }];
  if (method === 'GET' && path.startsWith('/git/commits/')) {
    const commit = commits.get(path.slice('/git/commits/'.length));
    return commit ? [200, commit] : [404, {}];
  }
  if (method === 'GET' && path.startsWith('/contents/')) {
    const ref = url.searchParams.get('ref') ?? 'main';
    const commit = commits.get(ref === 'main' ? head : ref);
    const filename = path.slice('/contents/'.length);
    const blob = commit && trees.get(commit.tree.sha)?.[filename];
    const content = blobs.get(blob);
    return content === undefined ? [404, {}] : [200, {
      path: filename, sha: blob, size: Buffer.byteLength(content),
      content: Buffer.from(content).toString('base64'),
    }];
  }
  if (method === 'GET' && path.startsWith('/git/trees/')) {
    const ref = path.slice('/git/trees/'.length);
    const treeId = commits.get(ref === 'main' ? head : ref)?.tree.sha ?? ref;
    const tree = trees.get(treeId);
    return tree ? [200, { sha: treeId, truncated: false,
      tree: Object.entries(tree).map(([path, sha]) => ({ path, sha, type: 'blob', mode: '100644' })),
    }] : [404, {}];
  }
  if (method === 'POST' && path === '/git/blobs') {
    const content = body.encoding === 'base64' ? Buffer.from(body.content, 'base64').toString() : body.content;
    return [201, { sha: storeBlob(content) }];
  }
  if (method === 'POST' && path === '/git/trees') {
    if (!trees.has(body.base_tree)) return [422, {}];
    const tree = { ...trees.get(body.base_tree) };
    for (const entry of body.tree) {
      if (!entry.path.startsWith('storage/scraps/') || entry.type !== 'blob') return [422, {}];
      if (entry.sha === null) delete tree[entry.path];
      else tree[entry.path] = entry.content === undefined ? entry.sha : storeBlob(entry.content);
    }
    const id = sha(tree);
    trees.set(id, tree);
    return [201, { sha: id }];
  }
  if (method === 'POST' && path === '/git/commits') {
    if (!trees.has(body.tree) || body.parents.length !== 1 || !commits.has(body.parents[0])) return [422, {}];
    const id = sha(body);
    commits.set(id, { tree: { sha: body.tree }, parents: body.parents });
    return [201, { sha: id }];
  }
  if (method === 'PATCH' && path === '/git/refs/heads/main') {
    const candidate = commits.get(body.sha);
    if (body.force !== false || candidate?.parents[0] !== head) return [422, {}];
    head = body.sha;
    return [200, { object: { sha: head } }];
  }
  return [403, { message: 'Request denied by editor fixture' }];
}

const nativeFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const method = request.method;
  if (url.origin === 'http://127.0.0.1:4174' && method === 'GET') return nativeFetch(request, { redirect: 'error' });
  let status = 403;
  let payload = { message: 'External fetch denied by editor fixture' };
  if (url.origin === 'https://api.github.com' && url.pathname.startsWith(`${prefix}/`)) {
    const text = method === 'GET' || method === 'HEAD' ? '' : await request.text();
    const body = text ? JSON.parse(text) : undefined;
    [status, payload] = fixture(url, method, body);
  }
  appendFileSync(ledger, `${JSON.stringify({ method, path: url.pathname, status })}\n`, { mode: 0o600 });
  return Response.json(payload, { status });
};
