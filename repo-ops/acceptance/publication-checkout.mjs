import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function capture(cwd, command, args, input) {
  const result = spawnSync(command, args, { cwd, input, maxBuffer: 128 * 1024 * 1024 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}

export function gitRevision(source, ref) {
  const commit = capture(source, 'git', ['rev-parse', '--verify', ref + '^{commit}']).toString().trim();
  assert.match(commit, /^[0-9a-f]{40}$/);
  const treeOid = capture(source, 'git', ['rev-parse', '--verify', commit + '^{tree}']).toString().trim();
  assert.match(treeOid, /^[0-9a-f]{40}$/);
  return { commit, tree: treeOid };
}

export function archivePublicationCheckout(source, destination, commit) {
  assert.match(commit, /^[0-9a-f]{40}$/);
  assert.equal(readdirSync(destination).length, 0, 'publication destination must be empty');
  const entries = new TextDecoder('utf-8', { fatal: true }).decode(capture(source, 'git', ['ls-tree', '-rz', '--full-tree', commit])).split('\0').filter(Boolean);
  const files = [];
  for (const entry of entries) {
    const separator = entry.indexOf('\t');
    assert.ok(separator > 0, 'invalid Git tree entry');
    const [mode, type, oid] = entry.slice(0, separator).split(' ');
    const path = entry.slice(separator + 1);
    const parts = path.split('/');
    if (parts.some(part => part.startsWith('.env') || part === '.git')) continue;
    assert.ok(parts.every(part => part && part !== '.' && part !== '..'), `Unsupported publication path: ${path}`);
    assert.ok(type === 'blob' && ['100644', '100755'].includes(mode), `Unsupported publication checkout entry: ${path}`);
    assert.match(oid, /^[0-9a-f]{40}$/);
    files.push({ mode, oid, path });
  }
  assert.ok(files.length > 0, 'empty publication snapshot');
  // Read exact Git blobs in one batch. git archive can omit or rewrite files
  // via export-ignore/export-subst; checkout can apply filters and EOL conversion.
  const bytes = capture(source, 'git', ['cat-file', '--batch'], files.map(file => file.oid).join('\n') + '\n');
  let offset = 0;
  for (const file of files) {
    const end = bytes.indexOf(10, offset);
    assert.ok(end >= offset, 'missing Git blob header');
    const [oid, type, length] = bytes.subarray(offset, end).toString().split(' ');
    assert.equal(oid, file.oid);
    assert.equal(type, 'blob');
    assert.match(length, /^\d+$/);
    const size = Number(length);
    assert.ok(Number.isSafeInteger(size) && end + 1 + size < bytes.length, 'truncated Git blob');
    offset = end + 1 + size;
    assert.equal(bytes[offset++], 10, 'missing Git blob delimiter');
    const target = join(destination, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes.subarray(end + 1, end + 1 + size), { flag: 'wx', mode: file.mode === '100755' ? 0o700 : 0o600 });
  }
  assert.equal(offset, bytes.length, 'unexpected Git batch output');
}
