import { spawn } from 'node:child_process';
import { mkdirSync, openSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence');
if (output === root || output.startsWith(`${root}/`)) throw new Error('Evidence must be outside the repository');
mkdirSync(output, { recursive: true, mode: 0o700 });
const ledger = resolve(output, 'github-ledger.jsonl');
writeFileSync(ledger, '', { mode: 0o600 });
const log = openSync(resolve(output, 'web-server.log'), 'w', 0o600);
const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  LANG: 'C.UTF-8',
  NODE_ENV: 'development',
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: `--import=${resolve(import.meta.dirname, 'editor-github-preload.mjs')}`,
  EDITOR_FIXTURE_LEDGER: ledger,
  EDITOR_ADMIN_PASSWORD: 'fixture-password-not-a-secret',
  EDITOR_SESSION_SECRET: 'fixture-session-secret-not-real-credentials-1234567890',
  GITHUB_CONTENT_TOKEN: 'fixture-token-not-a-secret',
  GITHUB_CONTENT_OWNER: 'fixture',
  GITHUB_CONTENT_REPO: 'editor',
  GITHUB_CONTENT_BRANCH: 'main',
  GITHUB_CONTENT_ROOT: 'storage',
};
const child = spawn('node', [resolve(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '4174'], {
  cwd: resolve(root, 'product/apps/web'), env, stdio: ['ignore', log, log],
});
process.once('SIGINT', () => child.kill('SIGINT'));
process.once('SIGTERM', () => child.kill('SIGTERM'));
child.once('error', (error) => { console.error(error); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 1; });
