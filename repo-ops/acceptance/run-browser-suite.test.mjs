import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';

test('browser checkout lease rejects collisions and releases after cancellation', { timeout: 25000 }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'browser-lease-'));
  const checkout = join(dir, 'checkout');
  const output = join(dir, 'evidence');
  const bin = join(dir, 'bin');
  mkdirSync(join(checkout, 'repo-ops/acceptance'), { recursive: true });
  mkdirSync(join(checkout, 'repo-ops/evidence'), { recursive: true });
  mkdirSync(join(checkout, 'repo-ops/operations'), { recursive: true });
  mkdirSync(bin);
  cpSync(new URL('./run-browser-suite.mjs', import.meta.url), join(checkout, 'repo-ops/acceptance/run-browser-suite.mjs'));
  cpSync(new URL('../operations/owned-process-group.mjs', import.meta.url), join(checkout, 'repo-ops/operations/owned-process-group.mjs'));
  cpSync(new URL('../evidence/external-evidence-path.mjs', import.meta.url), join(checkout, 'repo-ops/evidence/external-evidence-path.mjs'));
  writeFileSync(join(bin, 'bun'), '#!/bin/sh\nif [ "${LEASE_FAST:-}" = 1 ]; then exit 0; fi\necho $$ > "$PLAYWRIGHT_OUTPUT_DIR/leader"\nsleep 60 &\necho $! > "$PLAYWRIGHT_OUTPUT_DIR/descendant"\nwait\n', { mode: 0o700 });
  const env = { ...process.env, PATH: bin + ':' + process.env.PATH, PLAYWRIGHT_OUTPUT_DIR: output };
  const command = join(checkout, 'repo-ops/acceptance/run-browser-suite.mjs');
  const first = spawn(process.execPath, [command, 'editor'], { env, stdio: 'ignore' });
  const ended = once(first, 'exit');
  let childPid;
  try {
    for (let i = 0; i < 100; i++) {
      try {
        const firstOutput = join(output, readdirSync(output)[0]);
        childPid = Number(readFileSync(join(firstOutput, 'descendant'), 'utf8'));
        break;
      } catch { await delay(50); }
    }
    assert.ok(childPid, 'descendant started under lease');
    const competing = spawnSync(process.execPath, [command, 'fixture'], { env: { ...env, LEASE_FAST: '1' }, timeout: 5000 });
    assert.equal(competing.status, 1, 'same checkout must refuse overlap');
    assert.equal(readdirSync(output).length, 2, 'attempts have distinct evidence directories');
    first.kill('SIGTERM');
    assert.notEqual((await ended)[0], 0);
    // A terminated process can briefly be a zombie. It must not still execute.
    try { assert.match(readFileSync('/proc/' + childPid + '/stat', 'utf8'), /\) Z /); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
    const resumed = spawnSync(process.execPath, [command, 'fixture'], { env: { ...env, LEASE_FAST: '1' }, timeout: 5000 });
    assert.equal(resumed.status, 0, 'lease released after cancellation');
    assert.equal(readdirSync(output).length, 3);
  } finally {
    if (first.exitCode === null && first.signalCode === null) { first.kill('SIGTERM'); await ended; }
    rmSync(dir, { recursive: true, force: true });
  }
});


// F-01: a normal spawn deliberately does not inherit the lease descriptor.
const drainStub = `#!/usr/bin/env node
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const path = process.env.TEST_DIR;
if (process.env.LEASE_FAST === '1') {
  fs.writeFileSync(path + '/entered', 'yes');
  process.exit(0);
}
spawn(process.execPath, ['-e', \`const fs = require('node:fs');
  const path = process.env.TEST_DIR;
  process.on('SIGTERM', () => fs.writeFileSync(path + '/term', 'yes'));
  fs.writeFileSync(path + '/worker', String(process.pid));
  setInterval(() => {}, 100);\`], { stdio: 'ignore' });
const timer = setInterval(() => {
  if (fs.existsSync(path + '/worker')) {
    clearInterval(timer);
    process.exit(Number(process.env.LEADER_EXIT));
  }
}, 10);
`;

function drainFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'browser-drain-'));
  const checkout = join(dir, 'checkout');
  const bin = join(dir, 'bin');
  const paths = ['acceptance/run-browser-suite.mjs', 'operations/owned-process-group.mjs', 'evidence/external-evidence-path.mjs'];
  for (const path of paths) {
    const target = join(checkout, 'repo-ops', path);
    mkdirSync(join(target, '..'), { recursive: true });
    cpSync(new URL('../' + path, import.meta.url), target);
  }
  mkdirSync(bin);
  writeFileSync(join(bin, 'bun'), drainStub, { mode: 0o700 });
  const env = { PATH: bin + ':' + process.env.PATH, HOME: dir, TEST_DIR: dir, PLAYWRIGHT_OUTPUT_DIR: join(dir, 'evidence') };
  const command = join(checkout, 'repo-ops/acceptance/run-browser-suite.mjs');
  return { dir, checkout, env, command };
}

function workerLive(pid) {
  try { return !/\) [ZX] /.test(readFileSync('/proc/' + pid + '/stat', 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function waitForFile(path) {
  const deadline = performance.now() + 5000;
  while (performance.now() < deadline) {
    try { return readFileSync(path, 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await delay(10);
  }
  throw new Error('Timed out waiting for ' + path);
}

for (const [leaderExit, cancel, expected] of [[0, false, 0], [7, false, 7], [0, true, 143]]) {
  test('lease covers group drain after leader exit ' + leaderExit + (cancel ? ' with cancellation' : ''), { timeout: 20000 }, async () => {
    const { dir, env, command } = drainFixture();
    const first = spawn(process.execPath, [command, 'editor'], { env: { ...env, LEADER_EXIT: String(leaderExit) }, stdio: 'ignore' });
    const ended = once(first, 'exit');
    let worker;
    const probe = () => spawnSync(process.execPath, [command, 'fixture'], { env: { ...env, LEASE_FAST: '1' }, timeout: 2000, encoding: 'utf8' });
    try {
      worker = Number(await waitForFile(join(dir, 'worker')));
      await waitForFile(join(dir, 'term'));
      assert.equal(first.exitCode, null);
      assert.equal(workerLive(worker), true);
      if (cancel) first.kill('SIGTERM');
      const competing = probe();
      assert.equal(competing.status, 1, competing.stderr);
      assert.throws(() => readFileSync(join(dir, 'entered')), { code: 'ENOENT' });
      assert.equal(workerLive(worker), true, 'probe must run during drain');
      assert.deepEqual(await ended, [expected, null]);
      assert.equal(workerLive(worker), false);
      const resumed = probe();
      assert.equal(resumed.status, 0, resumed.stderr);
      assert.equal(readFileSync(join(dir, 'entered'), 'utf8'), 'yes');
    } finally {
      if (first.exitCode === null && first.signalCode === null) { first.kill('SIGTERM'); await ended; }
      if (worker && workerLive(worker)) process.kill(worker, 'SIGKILL');
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test('cleanup failure is reported even when the browser leader succeeds', () => {
  const { dir, checkout, env, command } = drainFixture();
  const helper = join(checkout, 'repo-ops/operations/owned-process-group.mjs');
  const original = readFileSync(helper, 'utf8');
  try {
    // Fault injection only in the disposable copy, with no live worker.
    writeFileSync(helper, original.replace('if (!pid || !hasLiveGroupMembers(pid)) return;', "throw new Error('fixture cleanup failure');"));
    const run = () => spawnSync(process.execPath, [command, 'fixture'], { env: { ...env, LEASE_FAST: '1' }, timeout: 5000, encoding: 'utf8' });
    const failed = run();
    assert.equal(failed.status, 1);
    assert.match(failed.stderr, /fixture cleanup failure/);
    writeFileSync(helper, original);
    assert.equal(run().status, 0);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('unknown browser suite fails before allocating evidence or launching a child', () => {
  const { dir, env, command } = drainFixture();
  try {
    for (const args of [[], [''], ['unknown'], ['constructor'], ['__proto__'], ['toString']]) {
      const result = spawnSync(process.execPath, [command, ...args], {
        env: { ...env, LEASE_FAST: '1' }, timeout: 5000, encoding: 'utf8',
      });
      assert.equal(result.status, 1, result.stderr);
      assert.match(result.stderr, /Unknown browser suite/);
      assert.throws(() => readdirSync(env.PLAYWRIGHT_OUTPUT_DIR), { code: 'ENOENT' });
      assert.throws(() => readFileSync(join(dir, 'entered')), { code: 'ENOENT' });
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
