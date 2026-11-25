import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

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
  const entries = capture(source, 'git', ['ls-tree', '-rz', '--full-tree', commit]).toString().split('\0').filter(Boolean);
  const paths = [];
  for (const entry of entries) {
    const separator = entry.indexOf('\t');
    assert.ok(separator > 0, 'invalid Git tree entry');
    const [mode, type] = entry.slice(0, separator).split(' ');
    const path = entry.slice(separator + 1);
    if (path.split('/').some(part => part.startsWith('.env') || part === '.git')) continue;
    assert.ok(type === 'blob' && ['100644', '100755'].includes(mode), `Unsupported publication checkout entry: ${path}`);
    paths.push(path);
  }
  assert.ok(paths.length > 0, 'empty publication snapshot');
  // Archive only committed, explicitly selected literal paths. Never copy a
  // working-tree symlink, an untracked file, or dotenv contents.
  const archive = capture(source, 'git', ['--literal-pathspecs', 'archive', commit, '--', ...paths]);
  capture(source, 'tar', ['-xf', '-', '-C', destination], archive);
}
