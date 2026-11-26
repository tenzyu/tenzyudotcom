import { spawn, spawnSync } from 'node:child_process';
import { closeSync, cpSync, mkdirSync, mkdtempSync, openSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initGitContentFixture } from './git-content-fixture.mjs';
import { initialFiles, seededScrap, scrapsIndexPath, serialize } from './publication-fixture.mjs';
import { externalEvidencePath } from '../evidence/external-evidence-path.mjs';

const root = resolve(import.meta.dirname, '../..');
const output = externalEvidencePath(root, process.env.PLAYWRIGHT_OUTPUT_DIR ?? '/tmp/tenzyudotcom-editor-evidence');
const port = process.env.PLAYWRIGHT_EDITOR_PORT ?? '4174';
const production = process.env.EDITOR_BROWSER_PRODUCTION === '1';
mkdirSync(output, { recursive: true, mode: 0o700 });
const fixtureDir = mkdtempSync(resolve(output, 'fixture-'));
const repository = resolve(fixtureDir, 'content.git');
const seed = process.env.EDITOR_FIXTURE_SEED === 'public'
  ? { ...initialFiles, ...seededScrap.files, [scrapsIndexPath]: serialize([seededScrap.projection]) }
  : { 'storage/scraps/index.json': '[]\n' };
const fixture = initGitContentFixture(repository, seed);
writeFileSync(resolve(output, 'fixture-head'), fixture.head() + '\n', { mode: 0o600 });
writeFileSync(resolve(output, 'fixture-path'), fixtureDir, { mode: 0o600 });
const ledger = resolve(output, 'github-ledger.jsonl');
writeFileSync(ledger, '', { mode: 0o600 });
const log = openSync(resolve(output, 'web-server.log'), 'w', 0o600);
const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  LANG: 'C.UTF-8',
  NODE_ENV: production ? 'production' : 'development',
  TZ: 'UTC',
  NEXT_TELEMETRY_DISABLED: '1',
  ...(production && process.env.EDITOR_FIXTURE_SEED === 'public' ? { REPO_OPS_FIXTURE_SOURCE_MAPS: '1' } : {}),
  NX_DAEMON: 'false',
  NX_NO_CLOUD: 'true',
  NX_TUI: 'false',
  NX_LOAD_DOT_ENV_FILES: 'false',
  NODE_OPTIONS: `--import=${resolve(import.meta.dirname, 'editor-github-preload.mjs')}`,
  EDITOR_FIXTURE_LEDGER: ledger,
  EDITOR_FIXTURE_ORIGIN: `http://127.0.0.1:${port}`,
  EDITOR_ALLOWED_ORIGIN: `http://127.0.0.1:${port}`,
  EDITOR_FIXTURE_REPO: repository,
  EDITOR_FIXTURE_DOCUMENT_LOSS: resolve(fixtureDir, 'drop-document-response'),
  EDITOR_FIXTURE_REF_LOSS: resolve(fixtureDir, 'drop-ref-response'),
  EDITOR_ADMIN_PASSWORD: 'fixture-password-not-a-secret',
  EDITOR_SESSION_SECRET: 'fixture-session-secret-not-real-credentials-1234567890',
  GITHUB_CONTENT_TOKEN: 'fixture-token-not-a-secret',
  GITHUB_CONTENT_OWNER: 'fixture',
  GITHUB_CONTENT_REPO: 'editor',
  GITHUB_CONTENT_BRANCH: 'main',
  GITHUB_CONTENT_ROOT: 'storage',
};
const cwd = resolve(root, 'product/apps/web');
const next = resolve(root, 'node_modules/next/dist/bin/next');
if (process.argv.includes('--analyze-only')) {
  if (!production) throw new Error('Analyze only requires production fixture mode');
  const analysisLog = openSync(resolve(output, 'next-analyze.log'), 'wx', 0o600);
  const analysis = spawnSync('node', [next, 'experimental-analyze', '--output'], { cwd, env, stdio: ['ignore', analysisLog, analysisLog] });
  closeSync(analysisLog);
  closeSync(log);
  if (analysis.error) throw analysis.error;
  if (analysis.status !== 0) process.exit(analysis.status ?? 1);
  cpSync(resolve(cwd, '.next/diagnostics/analyze'), resolve(output, 'next-analysis'), { recursive: true, errorOnExist: true, force: false });
  process.exit(0);
}
if (production) {
  const buildLog = openSync(resolve(output, 'next-build.log'), 'w', 0o600);
  const build = spawnSync('node', [next, 'build'], { cwd, env, stdio: ['ignore', buildLog, buildLog] });
  if (build.error) throw build.error;
  if (build.status !== 0) process.exit(build.status ?? 1);
}
const child = spawn('node', [next, production ? 'start' : 'dev', '--hostname', '127.0.0.1', '--port', port], {
  cwd, env, stdio: ['ignore', log, log],
});
process.once('SIGINT', () => child.kill('SIGINT'));
process.once('SIGTERM', () => child.kill('SIGTERM'));
child.once('error', (error) => { console.error(error); process.exitCode = 1; });
child.once('exit', (code) => { process.exitCode = code ?? 1; });
