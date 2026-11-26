import { spawn, spawnSync } from 'node:child_process';
import { closeSync, mkdirSync, mkdtempSync, openSync } from 'node:fs';
import { constants, tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { drainOwnedProcessGroup, signalOwnedGroup } from '../operations/owned-process-group.mjs';
import { externalEvidencePath } from '../evidence/external-evidence-path.mjs';

const suite = process.argv[2];
const config = { public: 'playwright.config.ts', editor: 'playwright.editor.config.ts', fixture: 'playwright.fixture.config.ts' }[suite];
if (!config) throw new Error('Unknown browser suite');
const root = resolve(import.meta.dirname, '../..');
const parent = externalEvidencePath(root, process.env.PLAYWRIGHT_OUTPUT_DIR ?? tmpdir(), { disjoint: false });
mkdirSync(parent, { recursive: true, mode: 0o700 });
const output = mkdtempSync(resolve(parent, suite + '-'));
console.log('Browser evidence: ' + output);

// flock(2) locks an open file description. The supervisor keeps its directory
// FD until group drain finishes; the helper only acquires it through FD 3.
// Ordinary child stdio does not inherit the lease FD.
const lease = openSync(root, 'r');
try {
  const acquired = spawnSync('flock', ['--nonblock', '3'], {
    stdio: ['ignore', 'inherit', 'inherit', lease],
  });
  if (acquired.error) throw acquired.error;
  if (acquired.status !== 0) {
    console.error('Unable to acquire browser checkout lease: ' + root);
    process.exitCode = acquired.status ?? 1;
  } else {
    const env = { ...process.env, PLAYWRIGHT_OUTPUT_DIR: output, BROWSER_EVIDENCE_DIR: output, NX_LOAD_DOT_ENV_FILES: 'false' };
    const child = spawn('bun', ['--no-env-file', 'nx', 'run', 'web:browser-' + suite, ...process.argv.slice(3)], {
      cwd: root, env, stdio: 'inherit', detached: true,
    });
    let interrupted;
    let draining = false;
    let timer;
    let spawnError;
    function stop(signal) {
      if (interrupted) return;
      interrupted = signal;
      if (draining || !child.pid) return;
      signalOwnedGroup(child.pid, signal);
      timer = setTimeout(() => signalOwnedGroup(child.pid, 'SIGKILL'), 10000);
      timer.unref();
    }
    const term = () => stop('SIGTERM');
    const interrupt = () => stop('SIGINT');
    process.on('SIGTERM', term);
    process.on('SIGINT', interrupt);
    try {
      child.once('error', error => { spawnError = error; });
      const [code, signal] = await new Promise(done => child.once('exit', (...args) => done(args)).once('error', () => done([null, null])));
      draining = true;
      clearTimeout(timer);
      await drainOwnedProcessGroup(child.pid);
      if (spawnError) throw spawnError;
      const stopped = interrupted ?? signal;
      process.exitCode = stopped ? 128 + constants.signals[stopped] : code ?? 1;
    } finally {
      clearTimeout(timer);
      process.off('SIGTERM', term);
      process.off('SIGINT', interrupt);
    }
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  closeSync(lease);
}
