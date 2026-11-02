import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('./candidate-state-cli.mjs', import.meta.url));
const proposal = { receivedAt: '2026-11-02T12:00:00Z', project: 'example', source: 'Obsidian', original: '$(touch never-run)', maxAttempts: 2 };
const run = (dir, command, id, input) => spawnSync(process.execPath, [cli, command, dir, id], { input: input === undefined ? '' : JSON.stringify(input), encoding: 'utf8', timeout: 10000 });
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'candidate-cli-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test('CLI proposes, displays and manually approves without executing text or overwriting', (t) => {
  const dir = fixture(t);
  const marker = join(dir, 'executed');
  const input = { ...proposal, original: `$(touch ${marker})` };
  const created = run(dir, 'propose', 'task-1', input);
  assert.equal(created.status, 0, created.stderr);
  assert.equal(JSON.parse(created.stdout).status, 'proposed');
  assert.equal(JSON.parse(run(dir, 'show', 'task-1').stdout).original, input.original);
  assert.equal(existsSync(marker), false);
  const before = readFileSync(join(dir, 'task-1.json'), 'utf8');
  assert.notEqual(run(dir, 'propose', 'task-1', { ...proposal, original: 'replace' }).status, 0);
  assert.equal(readFileSync(join(dir, 'task-1.json'), 'utf8'), before);
  assert.notEqual(run(dir, 'approve', 'task-1', { worktree: '/tree', session: 'session' }).status, 0);
  const approved = run(dir, 'approve', 'task-1', { worktree: '/tree', session: 'session', approval: 'human approves' });
  assert.equal(approved.status, 0, approved.stderr);
  assert.equal(JSON.parse(approved.stdout).status, 'approved');
  assert.notEqual(run(dir, 'approve', 'task-1', { worktree: '/tree', session: 'session', approval: 'again' }).status, 0);
  assert.notEqual(run(dir, 'start', 'task-1', {}).status, 0);
  assert.notEqual(run(dir, 'resume', 'task-1', {}).status, 0);
});

test('CLI rejects traversal, non-private directories and symlink state files', (t) => {
  const dir = fixture(t);
  for (const id of ['../outside', '..', '/absolute', 'a/b', '.hidden']) assert.notEqual(run(dir, 'propose', id, proposal).status, 0);
  const target = join(dir, 'target');
  writeFileSync(target, 'unchanged', { mode: 0o600 });
  symlinkSync(target, join(dir, 'link.json'));
  assert.notEqual(run(dir, 'show', 'link').status, 0);
  assert.notEqual(run(dir, 'propose', 'link', proposal).status, 0);
  assert.equal(readFileSync(target, 'utf8'), 'unchanged');
  chmodSync(dir, 0o755);
  assert.notEqual(run(dir, 'propose', 'task', proposal).status, 0);
});
