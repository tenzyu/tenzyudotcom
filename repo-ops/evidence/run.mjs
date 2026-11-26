import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, openSync, closeSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { drainOwnedProcessGroup, signalOwnedGroup } from '../operations/owned-process-group.mjs';
import { externalEvidencePath } from './external-evidence-path.mjs';

// Keep raw output private and outside Git. No application credentials are inherited.
const { values, positionals } = parseArgs({
  options: { cwd: { type: 'string' }, out: { type: 'string' }, timeout: { type: 'string', default: '120' } },
  allowPositionals: true,
});
if (!values.cwd || !values.out || !positionals.length) {
  throw new Error('Usage: node run.mjs --cwd DIR --out NEW_EXTERNAL_DIR [--timeout SECONDS] -- COMMAND ARGS');
}
const cwd = resolve(values.cwd);
const out = externalEvidencePath(cwd, values.out);
const seconds = Number(values.timeout);
if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('timeout must be positive');
mkdirSync(out, { mode: 0o700 });
const logPath = `${out}/output.log`;
const log = openSync(logPath, 'wx', 0o600);
const env = {};
// NixOS Bash otherwise reloads /etc/profile and replaces the toolchain PATH.
for (const key of ['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', '__ETC_PROFILE_DONE', 'NIX_SSL_CERT_FILE', 'SSL_CERT_FILE', 'LD_LIBRARY_PATH', 'BIOME_BIN', 'PKG_CONFIG_PATH', 'XDG_DATA_DIRS']) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, { CI: '1', NX_DAEMON: 'false', NX_NO_CLOUD: 'true', NX_SKIP_NX_CACHE: 'true', NX_LOAD_DOT_ENV_FILES: 'false', NEXT_TELEMETRY_DISABLED: '1' });
const startedAt = new Date().toISOString();
const start = performance.now();
const child = spawn(positionals[0], positionals.slice(1), { cwd, env, detached: true, stdio: ['ignore', log, log] });
let timedOut = false;
let interrupted;
let spawnError;
let escalation;
const killGroup = (signal) => {
  signalOwnedGroup(child.pid, signal);
};
// Timeout and external cancellation may overlap. One escalation owns the group;
// replacing the timer handle would leave the first timer armed after cleanup.
let stopping = false;
function stopGroup() {
  if (stopping) return;
  stopping = true;
  killGroup('SIGTERM');
  escalation = setTimeout(() => killGroup('SIGKILL'), 3000);
}
const timer = setTimeout(() => {
  timedOut = true;
  stopGroup();
}, seconds * 1000);
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
  interrupted ??= signal;
  stopGroup();
});
child.on('error', (error) => { spawnError = error.message; });
child.on('close', async (exitCode, signal) => {
  stopping = true; // The drain below now exclusively owns group cleanup.
  clearTimeout(timer);
  clearTimeout(escalation);
  // Also stop background descendants of an otherwise successful leader before hashing.
  let cleanupError;
  try { await drainOwnedProcessGroup(child.pid); }
  catch (error) { cleanupError = String(error); }
  closeSync(log);
  const hash = createHash('sha256');
  if (!cleanupError) for await (const chunk of createReadStream(logPath)) hash.update(chunk);
  const result = {
    schemaVersion: 1, cwd, command: positionals, startedAt,
    durationMs: Math.round(performance.now() - start),
    status: interrupted ? 'cancelled' : timedOut ? 'timeout' : spawnError ? 'not-run' : exitCode === 0 && !cleanupError ? 'passed' : 'failed',
    exitCode, signal, spawnError, cleanupError, logSha256: cleanupError ? null : hash.digest('hex'),
    environment: 'allowlisted; application .env files must be excluded from the evaluation copy',
  };
  writeFileSync(`${out}/result.json`, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify(result));
  process.exitCode = interrupted ? (interrupted === 'SIGINT' ? 130 : 143) : timedOut ? 124 : spawnError ? 127 : cleanupError ? 1 : exitCode ?? 1;
});
