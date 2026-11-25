import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { externalEvidencePath } from '../evidence/external-evidence-path.mjs';

const suite = process.argv[2];
const config = { public: 'playwright.config.ts', editor: 'playwright.editor.config.ts', fixture: 'playwright.fixture.config.ts' }[suite];
if (!config) throw new Error('Unknown browser suite');
const root = resolve(import.meta.dirname, '../..');
const parent = externalEvidencePath(root, process.env.PLAYWRIGHT_OUTPUT_DIR ?? tmpdir(), { disjoint: false });
mkdirSync(parent, { recursive: true, mode: 0o700 });
const output = mkdtempSync(resolve(parent, suite + '-'));
console.log('Browser evidence: ' + output);
// Linux flock owns the checkout lease for the complete build + browser run.
// It is released by the kernel on process termination, not a stale PID file.
const env = { ...process.env, PLAYWRIGHT_OUTPUT_DIR: output, BROWSER_EVIDENCE_DIR: output, NX_LOAD_DOT_ENV_FILES: 'false' };
const child = spawn('flock', ['--nonblock', root, 'bun', '--no-env-file', 'nx', 'run', 'web:browser-' + suite, ...process.argv.slice(3)], {
  cwd: root, env, stdio: 'inherit', detached: true,
});
let stopping = false;
let timer;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  timer = setTimeout(() => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }, 10000);
  timer.unref();
}
process.once('SIGTERM', () => stop('SIGTERM'));
process.once('SIGINT', () => stop('SIGINT'));
child.once('error', error => { console.error(error); process.exitCode = 1; });
child.once('exit', (code, signal) => { clearTimeout(timer); process.exitCode = stopping || signal ? 1 : code ?? 1; });
