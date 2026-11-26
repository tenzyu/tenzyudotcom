import { readdirSync, readFileSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

// Only groups created by our own detached children may be passed here.
// Linux /proc distinguishes live writers from unreaped zombies.
export function hasLiveGroupMembers(pid) {
  if (!pid) return false;
  if (!Number.isSafeInteger(pid) || pid <= 1) throw new Error('Invalid owned group ID');
  if (process.platform !== 'linux') throw new Error('Owned group drain requires Linux');
  for (const entry of readdirSync('/proc')) {
    if (!/^\d+$/.test(entry)) continue;
    let stat;
    try { stat = readFileSync('/proc/' + entry + '/stat', 'utf8'); }
    catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ESRCH') continue;
      throw error;
    }
    const [state, , group] = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    if (Number(group) === pid && state !== 'Z' && state !== 'X') return true;
  }
  return false;
}

export function signalOwnedGroup(pid, signal) {
  if (!pid) return;
  if (!Number.isSafeInteger(pid) || pid <= 1) throw new Error('Invalid owned group ID');
  try { process.kill(-pid, signal); }
  catch (error) { if (error.code !== 'ESRCH') throw error; }
}

export async function drainOwnedProcessGroup(pid, { graceMs = 3000, killMs = 5000 } = {}) {
  if (!pid || !hasLiveGroupMembers(pid)) return;
  const wait = async ms => {
    const deadline = performance.now() + ms;
    while (hasLiveGroupMembers(pid)) {
      if (performance.now() >= deadline) return false;
      await delay(25);
    }
    return true;
  };
  signalOwnedGroup(pid, 'SIGTERM');
  if (await wait(graceMs)) return;
  signalOwnedGroup(pid, 'SIGKILL');
  if (!(await wait(killMs))) throw new Error('Owned process group did not drain: ' + pid);
}
