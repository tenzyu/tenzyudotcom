import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export const fixtureBase = 'https://api.github.com/repos/fixture/editor';
const branch = 'refs/heads/main';
const oid = /^[0-9a-f]{40}$/;
const gitEnv = {
  PATH: process.env.PATH,
  LANG: 'C.UTF-8',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_AUTHOR_NAME: 'Fixture Author', GIT_AUTHOR_EMAIL: 'fixture@example.invalid',
  GIT_COMMITTER_NAME: 'Fixture Author', GIT_COMMITTER_EMAIL: 'fixture@example.invalid',
  GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z',
};

const safePath = (path) => typeof path === 'string' &&
  path.split('/').every((part) => part && part !== '.' && part !== '..' && !/[\\\0\r\n\t]/.test(part));

export function openGitContentFixture(directory, { allowNotesWrite = false } = {}) {
  function command(args, { input, index, allowFailure = false } = {}) {
    const result = spawnSync('git', ['-C', directory, ...args], {
      env: { ...gitEnv, ...(index ? { GIT_INDEX_FILE: index } : {}) }, input,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      if (allowFailure) return null;
      throw new Error(`Fixture git ${args[0]} failed: ${result.stderr.toString()}`);
    }
    return result.stdout;
  }
  const text = (args, options) => command(args, options)?.toString().trim() ?? null;
  const head = () => text(['rev-parse', branch]);
  const file = (ref, path) => command(['show', `${ref}:${path}`], { allowFailure: true });
  const blob = (content) => text(['hash-object', '-w', '--stdin'], { input: content });
  const tree = (ref) => text(['rev-parse', '--verify', `${ref}^{tree}`], { allowFailure: true });
  const parents = (ref) => text(['show', '-s', '--format=%P', ref]).split(' ').filter(Boolean);
  const history = () => text(['rev-list', branch]).split('\n');
  const listing = (ref) => {
    const value = command(['ls-tree', '-rtz', ref], { allowFailure: true });
    return value?.toString().split('\0').filter(Boolean).map((line) => {
      const [info, path] = line.split('\t');
      const [mode, type, sha] = info.split(' ');
      return { path, mode, type, sha };
    }) ?? null;
  };

  function writeTree(base, entries) {
    const temp = mkdtempSync(join(directory, 'index-'));
    const index = join(temp, 'index');
    try {
      if (base) command(['read-tree', base], { index });
      for (const { path, content, sha } of entries) {
        if (sha === null) {
          command(['update-index', '--index-info'], { index, input: `0 ${'0'.repeat(40)}\t${path}\n` });
        } else {
          command(['update-index', '--add', '--cacheinfo', '100644', sha ?? blob(content), path], { index });
        }
      }
      if (entries.length === 0 && !base) command(['read-tree', '--empty'], { index });
      return text(['write-tree'], { index });
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  }

  const commit = (treeId, bases, message) => text([
    'commit-tree', treeId, ...bases.flatMap((base) => ['-p', base]), '-m', message,
  ]);
  // A push to the bare repo itself exercises Git's non-fast-forward refusal.
  const publish = (candidate) => command([
    '-c', 'protocol.file.allow=always', 'push', '--quiet', directory, `${candidate}:${branch}`,
  ], { allowFailure: true }) !== null;
  const isAncestor = (base, tip) => command([
    'merge-base', '--is-ancestor', base, tip,
  ], { allowFailure: true }) !== null;

  function advance(files, message) {
    const parent = head();
    const entries = Object.entries(files).map(([path, content]) =>
      content === null ? { path, sha: null } : { path, content });
    const candidate = commit(writeTree(tree(parent), entries), [parent], message);
    if (!publish(candidate)) throw new Error('Fixture direct update was rejected');
    return candidate;
  }

  async function fetch(input, init) {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const base = new URL(fixtureBase);
    const { method, headers } = request;
    const respond = (status, payload, responseHeaders) =>
      status === 304 ? new Response(null, { status, headers: responseHeaders })
        : Response.json(payload ?? {}, { status, headers: responseHeaders });
    const denied = () => respond(403, { message: 'Request denied by Git content fixture' });
    if (url.origin !== base.origin || !url.pathname.startsWith(`${base.pathname}/`)) return denied();
    const path = decodeURIComponent(url.pathname.slice(base.pathname.length));
    if (method === 'GET' && path === '/git/ref/heads/main') {
      const sha = head();
      const etag = `"${sha}"`;
      return headers.get('if-none-match') === etag
        ? respond(304, null, { etag })
        : respond(200, { object: { sha } }, { etag });
    }
    if (method === 'GET' && path.startsWith('/git/commits/')) {
      const sha = path.slice('/git/commits/'.length);
      const id = oid.test(sha) && tree(sha);
      return id ? respond(200, { tree: { sha: id }, parents: parents(sha) }) : respond(404);
    }
    if (method === 'GET' && path.startsWith('/git/trees/')) {
      const ref = path.slice('/git/trees/'.length);
      const id = ref === 'main' ? tree(head()) : oid.test(ref) && tree(ref);
      return id ? respond(200, { sha: id, truncated: false, tree: listing(id) }) : respond(404);
    }
    if (method === 'GET' && path.startsWith('/contents/')) {
      const ref = url.searchParams.get('ref') ?? 'main';
      const filename = path.slice('/contents/'.length);
      if (!safePath(filename) || (ref !== 'main' && !oid.test(ref))) return denied();
      const revision = ref === 'main' ? head() : ref;
      const value = command(['cat-file', '--batch'], { input: `${revision}:${filename}\n` });
      const newline = value.indexOf(10);
      const [sha, type, size] = value.subarray(0, newline).toString().split(' ');
      if (type === 'missing') return respond(404);
      if (type !== 'blob') return respond(200, { type: 'dir' });
      const content = value.subarray(newline + 1, newline + 1 + Number(size));
      return respond(200, {
        type: 'file', encoding: 'base64', path: filename, sha,
        size: content.length, content: content.toString('base64'),
      });
    }
    if (method === 'GET' && path.startsWith('/compare/')) {
      const [a, b] = path.slice('/compare/'.length).split('...');
      if (!oid.test(a) || !oid.test(b)) return respond(404);
      const common = text(['merge-base', a, b], { allowFailure: true });
      if (!common) return respond(404);
      const status = a === b ? 'identical' : common === a ? 'ahead' : common === b ? 'behind' : 'diverged';
      return respond(200, { status, merge_base_commit: { sha: common } });
    }
    if (allowNotesWrite && method === 'PUT' && path === '/contents/storage/editor/notes.json') {
      const body = await request.json();
      const filename = 'storage/editor/notes.json';
      const previous = text(['rev-parse', '--verify', `${head()}:${filename}`], { allowFailure: true });
      if (body.branch !== 'main' || typeof body.message !== 'string' || typeof body.content !== 'string') return denied();
      if ((body.sha ?? null) !== previous) return respond(409);
      const bytes = Buffer.from(body.content, 'base64');
      if (bytes.toString('base64') !== body.content) return respond(422);
      const revision = advance({ [filename]: bytes.toString('utf8') }, body.message);
      const sha = text(['rev-parse', `${revision}:${filename}`]);
      return respond(previous ? 200 : 201, { content: { sha }, commit: { sha: revision } });
    }
    if (!((method === 'POST' && ['/git/blobs', '/git/trees', '/git/commits'].includes(path)) ||
          (method === 'PATCH' && path === '/git/refs/heads/main'))) return denied();
    const body = await request.json();
    if (method === 'POST' && path === '/git/blobs') {
      const content = body.encoding === 'base64' ? Buffer.from(body.content, 'base64') : body.content;
      return respond(201, { sha: blob(content) });
    }
    if (method === 'POST' && path === '/git/trees') {
      if (!oid.test(body.base_tree) || !tree(body.base_tree) || !Array.isArray(body.tree)) return respond(422);
      if (!body.tree.every((entry) => safePath(entry.path) &&
        /^storage\/(blog|scraps)\//.test(entry.path) && entry.type === 'blob' &&
        (entry.mode === undefined || entry.mode === '100644') &&
        (typeof entry.content === 'string' || entry.sha === null || oid.test(entry.sha)))) return respond(422);
      return respond(201, { sha: writeTree(body.base_tree, body.tree) });
    }
    if (method === 'POST' && path === '/git/commits') {
      if (!oid.test(body.tree) || !tree(body.tree) || body.parents?.length !== 1 ||
          !oid.test(body.parents[0]) || !tree(body.parents[0]) || typeof body.message !== 'string') return respond(422);
      return respond(201, { sha: commit(body.tree, body.parents, body.message) });
    }
    if (body.force !== false || !oid.test(body.sha) || !publish(body.sha)) return respond(422);
    return respond(200, { object: { sha: body.sha } });
  }

  function seed(files) {
    command(['init', '--bare', '--initial-branch=main', '--object-format=sha1']);
    const initialTree = writeTree(null, Object.entries(files).map(([path, content]) => ({ path, content })));
    const initial = commit(initialTree, [], 'Seed credential-free fixture');
    command(['update-ref', branch, initial]);
    return initial;
  }

  return { head, file, parents, history, listing, advance, fetch, seed, isAncestor };
}

export function initGitContentFixture(directory, files) {
  mkdirSync(directory, { mode: 0o700 });
  const fixture = openGitContentFixture(directory);
  fixture.seed(files);
  return fixture;
}
