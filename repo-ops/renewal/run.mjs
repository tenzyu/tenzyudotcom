import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, openSync, closeSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

// Keep raw output private and outside Git. No application credentials are inherited.
const { values, positionals } = parseArgs({
  options: { cwd: { type: 'string' }, out: { type: 'string' }, timeout: { type: 'string', default: '120' } },
  allowPositionals: true,
});
if (!values.cwd || !values.out || !positionals.length) {
  throw new Error('Usage: node run.mjs --cwd DIR --out NEW_EXTERNAL_DIR [--timeout SECONDS] -- COMMAND ARGS');
}
const cwd = resolve(values.cwd);
const out = resolve(values.out);
const seconds = Number(values.timeout);
if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('timeout must be positive');
if (out === cwd || out.startsWith(`${cwd}/`)) throw new Error('Evidence must be outside the command working tree');
mkdirSync(out, { mode: 0o700 });
const logPath = `${out}/output.log`;
const log = openSync(logPath, 'wx', 0o600);
const env = {};
for (const key of ['PATH', 'HOME', 'TMPDIR', 'LANG', 'LC_ALL', 'NIX_SSL_CERT_FILE', 'SSL_CERT_FILE', 'LD_LIBRARY_PATH', 'BIOME_BIN', 'PKG_CONFIG_PATH', 'XDG_DATA_DIRS']) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, { CI: '1', NX_DAEMON: 'false', NX_NO_CLOUD: 'true', NX_SKIP_NX_CACHE: 'true', NEXT_TELEMETRY_DISABLED: '1' });
const startedAt = new Date().toISOString();
const start = performance.now();
const child = spawn(positionals[0], positionals.slice(1), { cwd, env, detached: true, stdio: ['ignore', log, log] });
let timedOut = false;
let interrupted;
let spawnError;
let escalation;
const killGroup = (signal) => {
  if (!child.pid) return;
  try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
};
const timer = setTimeout(() => {
  timedOut = true;
  killGroup('SIGTERM');
  escalation = setTimeout(() => killGroup('SIGKILL'), 3000);
}, seconds * 1000);
for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
  interrupted = signal;
  killGroup('SIGTERM');
  escalation = setTimeout(() => killGroup('SIGKILL'), 3000);
});
child.on('error', (error) => { spawnError = error.message; });
child.on('close', async (exitCode, signal) => {
  clearTimeout(timer);
  clearTimeout(escalation);
  // Also stop background descendants of an otherwise successful leader before hashing.
  killGroup('SIGTERM');
  await new Promise((r) => setTimeout(r, 300));
  killGroup('SIGKILL');
  closeSync(log);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(logPath)) hash.update(chunk);
  const result = {
    schemaVersion: 1, cwd, command: positionals, startedAt,
    durationMs: Math.round(performance.now() - start),
    status: interrupted ? 'cancelled' : timedOut ? 'timeout' : spawnError ? 'not-run' : exitCode === 0 ? 'passed' : 'failed',
    exitCode, signal, spawnError, logSha256: hash.digest('hex'),
    environment: 'allowlisted; application .env files must be excluded from the evaluation copy',
  };
  writeFileSync(`${out}/result.json`, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
  console.log(JSON.stringify(result));
  process.exitCode = interrupted ? (interrupted === 'SIGINT' ? 130 : 143) : timedOut ? 124 : spawnError ? 127 : exitCode ?? 1;
});
