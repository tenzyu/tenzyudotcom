import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdtempSync, readFileSync, mkdirSync, rmSync, writeFileSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('./run.mjs', import.meta.url));
test('initialized system profile preserves tool resolution in child Bash', () => {
  const dir = mkdtempSync(join(tmpdir(), 'renewal-shell-path-'));
  try {
    const cwd = join(dir, 'workspace');
    const bin = join(dir, 'bin');
    mkdirSync(cwd);
    mkdirSync(bin);
    symlinkSync(process.execPath, join(bin, 'renewal-node'));
    const out = join(dir, 'evidence');
    const command = 'renewal-node -e \'if (process.env.__ETC_PROFILE_DONE !== "1" || process.env.GITHUB_TOKEN || process.env.BASH_ENV) process.exit(9); console.log("tool resolved")\'';
    const result = spawnSync(process.execPath, [runner, '--cwd', cwd, '--out', out, '--', 'bash', '-c', command], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, __ETC_PROFILE_DONE: '1', GITHUB_TOKEN: 'test-secret', BASH_ENV: join(dir, 'must-not-source') },
      encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.status, 0, `${result.stderr}\n${readFileSync(join(out, 'output.log'), 'utf8')}`);
    assert.match(readFileSync(join(out, 'output.log'), 'utf8'), /tool resolved/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

for (const [name, command, expectedCode, expectedStatus, timeout] of [
  ['success without inherited credentials', [process.execPath, '-e', 'if (process.env.GITHUB_TOKEN || process.env.NX_LOAD_DOT_ENV_FILES !== "false") process.exit(9); console.log("observed")'], 0, 'passed', '10'],
  ['failure', [process.execPath, '-e', 'process.exit(7)'], 7, 'failed', '10'],
  ['missing executable', ['renewal-command-does-not-exist'], 127, 'not-run', '10'],
  ['timeout', [process.execPath, '-e', 'setInterval(() => {}, 1000)'], 124, 'timeout', '0.1'],
]) {
  test(name, () => {
    const dir = mkdtempSync(join(tmpdir(), 'renewal-run-'));
    try {
      const cwd = join(dir, 'workspace');
      mkdirSync(cwd);
      const out = join(dir, 'evidence');
      const result = spawnSync(process.execPath, [runner, '--cwd', cwd, '--out', out, '--timeout', timeout, '--', ...command], {
        env: { ...process.env, GITHUB_TOKEN: 'test-secret-must-not-reach-child' }, encoding: 'utf8', timeout: 15000,
      });
      assert.equal(result.status, expectedCode, result.stderr);
      const report = JSON.parse(readFileSync(join(out, 'result.json'), 'utf8'));
      assert.equal(report.status, expectedStatus);
      assert.match(report.logSha256, /^[a-f0-9]{64}$/);
      const rerun = spawnSync(process.execPath, [runner, '--cwd', cwd, '--out', out, '--', ...command], { encoding: 'utf8' });
      assert.notEqual(rerun.status, 0, 'existing evidence must not be overwritten');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}

test('normal leader exit cannot leave a background writer modifying the hashed log', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'renewal-descendant-'));
  try {
    const cwd = join(dir, 'workspace');
    mkdirSync(cwd);
    const marker = join(dir, 'escaped');
    const descendant = `setTimeout(() => { require('fs').writeFileSync(${JSON.stringify(marker)}, 'escaped'); console.log('late write'); }, 1200)`;
    const leader = `require('child_process').spawn(process.execPath, ['-e', ${JSON.stringify(descendant)}], {stdio: 'inherit'}).unref()`;
    const result = spawnSync(process.execPath, [runner, '--cwd', cwd, '--out', join(dir, 'result'), '--', process.execPath, '-e', leader], { encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    await new Promise((r) => setTimeout(r, 1400));
    assert.equal(existsSync(marker), false);
    assert.equal(readFileSync(join(dir, 'result/output.log'), 'utf8'), '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('source preservation fails closed on missing saved entries and handles dangling symlinks', () => {
  const dir = mkdtempSync(join(tmpdir(), 'renewal-source-'));
  try {
    const root = join(dir, 'source');
    const saved = join(dir, 'saved');
    mkdirSync(root);
    mkdirSync(saved);
    writeFileSync(join(root, 'asset'), 'important');
    symlinkSync('missing-target', join(root, 'link'));
    const inventory = join(dir, 'inventory.json');
    writeFileSync(inventory, JSON.stringify({ root, entries: [{ path: 'asset', state: 'tracked' }, { path: 'link', state: 'untracked' }] }));
    const verifier = fileURLToPath(new URL('../recovery/verify-source.mjs', import.meta.url));
    const missing = spawnSync(process.execPath, [verifier, inventory, saved, join(dir, 'missing.json')], { encoding: 'utf8' });
    assert.equal(missing.status, 1);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'missing.json'), 'utf8')).missingSaved, ['asset', 'link']);
    writeFileSync(join(saved, 'asset'), 'important');
    symlinkSync('missing-target', join(saved, 'link'));
    const complete = spawnSync(process.execPath, [verifier, inventory, saved, join(dir, 'complete.json')], { encoding: 'utf8' });
    assert.equal(complete.status, 0, complete.stderr);
    assert.equal(JSON.parse(readFileSync(join(dir, 'complete.json'), 'utf8')).checked, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('runner refuses evidence through a symlink into the working tree', () => {
  const dir = mkdtempSync(join(tmpdir(), 'renewal-output-alias-'));
  try {
    const cwd = join(dir, 'workspace');
    mkdirSync(cwd);
    symlinkSync(cwd, join(dir, 'alias'));
    const result = spawnSync(process.execPath, [runner, '--cwd', cwd, '--out', join(dir, 'alias', 'evidence'), '--', process.execPath, '-e', 'process.exit(0)'], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /outside the checkout/);
    assert.equal(existsSync(join(cwd, 'evidence')), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});


test('overlapping timeout and cancellation cannot signal a group twice or retain an escalation timer', { timeout: 15000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'renewal-overlap-'));
  const cwd = join(dir, 'workspace');
  const out = join(dir, 'evidence');
  mkdirSync(cwd);
  // Acknowledge the first TERM in the private log, then leave enough time for
  // cancellation to overlap the timeout. A second TERM would change the log.
  const command = "process.on('SIGTERM',()=>{console.log('term');setTimeout(()=>process.exit(0),600)});console.log('ready');setInterval(()=>{},1000)";
  const wrapper = spawn(process.execPath, [runner, '--cwd', cwd, '--out', out, '--timeout', '0.5', '--', process.execPath, '-e', command], { stdio: 'ignore' });
  const ended = once(wrapper, 'exit');
  try {
    const deadline = Date.now() + 5000;
    let firstTerm = false;
    while (Date.now() < deadline) {
      if (existsSync(join(out, 'output.log')) && readFileSync(join(out, 'output.log'), 'utf8').includes('term')) { firstTerm = true; break; }
      await delay(20);
    }
    assert.ok(firstTerm, 'timeout delivered first TERM');
    wrapper.kill('SIGTERM');
    const [status] = await ended;
    assert.equal(status, 143);
    const report = JSON.parse(readFileSync(join(out, 'result.json'), 'utf8'));
    assert.equal(report.status, 'cancelled');
    assert.equal(readFileSync(join(out, 'output.log'), 'utf8').match(/^term$/gm)?.length, 1);
    assert.match(report.logSha256, /^[a-f0-9]{64}$/);
  } finally {
    if (wrapper.exitCode === null && wrapper.signalCode === null) { wrapper.kill('SIGTERM'); await ended; }
    rmSync(dir, { recursive: true, force: true });
  }
});
