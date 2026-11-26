import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { drainOwnedProcessGroup, hasLiveGroupMembers } from './owned-process-group.mjs';

test('leader exit does not establish descendant exit; resistant child drains before return', { timeout: 15000 }, async () => {
  const descendant = "process.on('SIGTERM', () => {}); console.log('ready'); setInterval(() => {}, 1000)";
  const leader = "const c=require('child_process').spawn(process.execPath,['-e',process.argv[1]],{stdio:['ignore','pipe','ignore']});c.stdout.once('data',()=>process.exit(0))";
  const processGroup = spawn(process.execPath, ['-e', leader, descendant], { detached: true, stdio: 'ignore' });
  try {
    const [status] = await once(processGroup, 'exit');
    assert.equal(status, 0);
    assert.equal(hasLiveGroupMembers(processGroup.pid), true, 'orphan survives parent exit');
    await drainOwnedProcessGroup(processGroup.pid, { graceMs: 100 });
    assert.equal(hasLiveGroupMembers(processGroup.pid), false);
  } finally {
    await drainOwnedProcessGroup(processGroup.pid, { graceMs: 0 });
  }
});
