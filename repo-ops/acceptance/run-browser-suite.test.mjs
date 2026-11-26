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
  mkdirSync(bin);
  cpSync(new URL('./run-browser-suite.mjs', import.meta.url), join(checkout, 'repo-ops/acceptance/run-browser-suite.mjs'));
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
