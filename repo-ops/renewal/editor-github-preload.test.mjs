import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';

test('fixture denies external fetches, bypasses env files and preserves immutable snapshots', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'editor-fixture-test-'));
  process.env.EDITOR_FIXTURE_LEDGER = join(dir, 'ledger.jsonl');
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Native network fetch must not run'); };
  try {
    await import('./editor-github-preload.mjs');
    const require = createRequire(new URL('../../product/apps/web/package.json', import.meta.url));
    assert.deepEqual(require('@next/env').loadEnvConfig('/does/not/exist', true, console, true).loadedEnvFiles, []);
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      for (const url of [
        'https://api.github.com/repos/real/content/git/refs/heads/main',
        'https://example.invalid/write',
        'http://127.0.0.1:4175/write',
      ]) assert.equal((await fetch(url, { method })).status, 403);
    }
    const base = 'https://api.github.com/repos/fixture/editor';
    const api = async (path, method = 'GET', body) => {
      const response = await fetch(`${base}${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      assert.ok(response.ok, `${method} ${path} returned ${response.status}`);
      return response.json();
    };
    assert.equal((await fetch(`${base}/unknown`, { method: 'DELETE' })).status, 403);
    const old = (await api('/git/ref/heads/main')).object.sha;
    const parent = await api(`/git/commits/${old}`);
    const blob = await api('/git/blobs', 'POST', { content: 'fixture body', encoding: 'utf-8' });
    const tree = await api('/git/trees', 'POST', { base_tree: parent.tree.sha, tree: [{ path: 'storage/scraps/test.mdx', type: 'blob', sha: blob.sha }] });
    const commit = await api('/git/commits', 'POST', { tree: tree.sha, parents: [old], message: 'fixture test' });
    assert.equal((await fetch(`${base}/contents/storage/scraps/test.mdx`)).status, 404);
    await api('/git/refs/heads/main', 'PATCH', { sha: commit.sha, force: false });
    assert.equal(Buffer.from((await api('/contents/storage/scraps/test.mdx')).content, 'base64').toString(), 'fixture body');
    assert.equal((await fetch(`${base}/contents/storage/scraps/test.mdx?ref=${old}`)).status, 404);
    assert.equal((await fetch(`${base}/git/refs/heads/main`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) })).status, 422);
    assert.equal((await api('/git/trees/main?recursive=1')).tree.length, 2);
    const rows = readFileSync(process.env.EDITOR_FIXTURE_LEDGER, 'utf8').trim().split('\n').map(JSON.parse);
    assert.ok(rows.every(row => Object.keys(row).join(',') === 'method,path,status'));
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.EDITOR_FIXTURE_LEDGER;
    rmSync(dir, { recursive: true });
  }
});
