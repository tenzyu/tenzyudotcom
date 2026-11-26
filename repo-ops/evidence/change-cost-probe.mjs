import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const [source, output, baseline] = process.argv.slice(2);
assert.match(baseline, /^[a-f0-9]{40}$/);
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
const candidate = git(source, ['rev-parse', 'HEAD']);
const scratch = mkdtempSync(join(process.env.RUNNER_TEMP ?? tmpdir(), 'phase2-change-cost-'));
const report = { mode: 'manual deterministic trace; same acceptance probes, not independent agent benchmark', baseline, candidate,
  toolchain: { node: process.version, bun: execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim() }, results: [] };
const worktrees = [];
const env = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8', CI: '1',
  NX_DAEMON: 'false', NX_NO_CLOUD: 'true', NX_LOAD_DOT_ENV_FILES: 'false' };
const tasks = [
  {
    id: 'editor-session', scope: 'product/apps/web/src/features/editor-auth', needle: 'function parseSession(',
    manifests: ['product/apps/web/package.json', 'product/apps/web/project.json'],
    extra: ['product/apps/web/src/features/editor-auth/editor-session.ts', 'product/apps/web/src/features/editor-auth/session-token.test.ts'],
    probe: 'product/apps/web/tests/fixtures/phase2-change-probe.ts',
    code: `import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { mock } from 'bun:test'
Object.assign(process.env, { NODE_ENV: 'test', EDITOR_ADMIN_PASSWORD: 'synthetic-password', EDITOR_SESSION_SECRET: 'synthetic-signing-key-for-test-only' })
const now = 1700000000000
Date.now = () => now
let token = ''
mock.module('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: token }) }) }))
const { getEditorAdminSessionExpiry } = await import('../../src/features/editor-auth/editor-session')
const sign = (exp: number, key = process.env.EDITOR_SESSION_SECRET!) => {
  const payload = Buffer.from(JSON.stringify({ sub: 'editor-admin', exp })).toString('base64url')
  return payload + '.' + createHmac('sha256', key).update(payload).digest('base64url')
}
token = sign(now + 1800000); assert.equal(await getEditorAdminSessionExpiry(), now + 1800000)
token = sign(now); assert.equal(await getEditorAdminSessionExpiry(), null)
token = sign(now + 1000, 'wrong-key'); assert.equal(await getEditorAdminSessionExpiry(), null)
token = sign(now + 7200000); assert.equal(await getEditorAdminSessionExpiry(), null, 'new acceptance: maximum remaining lifetime one hour')
`,
    edit: s => {
      const pattern = /payload\.exp <= (now|Date\.now\(\))/;
      assert.match(s, pattern);
      return s.replace(pattern, (_, clock) => 'payload.exp <= ' + clock + ' || payload.exp > ' + clock + ' + 3600000');
    },
  },
  {
    id: 'generic-button', scope: 'product/packages/ui/src/generic/components', needle: 'const buttonVariants = cva(',
    manifests: ['product/packages/ui/package.json','product/packages/ui/project.json'],
    extra: ['product/packages/ui/src/generic/components/button.test.tsx','product/packages/ui/src/lib/utils.ts'],
    probe: 'product/packages/ui/src/generic/components/phase2-change-probe.ts',
    code: `import assert from 'node:assert/strict'
import { buttonVariants } from './button'
assert.match(buttonVariants({ variant: 'secondary' }), /bg-secondary/)
assert.match(buttonVariants({ size: 'default' }), /\\bh-8\\b/)
assert.match(buttonVariants({ size: 'lg' }), /\\bh-10\\b/, 'new acceptance: large button height')
`,
    edit: s => {
      assert.ok(s.includes("lg: 'h-9 gap-1.5"));
      return s.replace("lg: 'h-9 gap-1.5", "lg: 'h-10 gap-1.5");
    },
  },
  {
    id: 'skin-classification', scope: 'product/packages/osu-skin-core/src', needle: 'const imageExts = new Set(',
    manifests: ['product/packages/osu-skin-core/package.json','product/packages/osu-skin-core/project.json'],
    extra: ['product/packages/osu-skin-core/src/classification.ts','product/packages/osu-skin-core/src/lib/domain/skin-asset.ts','product/packages/osu-skin-core/src/lib/domain/taxonomy.ts','product/packages/osu-skin-core/src/lib/domain/label.ts'],
    probe: 'product/packages/osu-skin-core/src/phase2-change-probe.ts',
    code: `import assert from 'node:assert/strict'
import { kindFor } from './classification'
assert.equal(kindFor('folder/cursor.PNG'), 'image')
assert.equal(kindFor('sound.wav'), 'audio')
assert.equal(kindFor('folder/preview.AVIF'), 'image', 'new acceptance: AVIF classification')
`,
    edit: s => {
      assert.ok(s.includes('".jpeg", ".webp"]'));
      return s.replace('".jpeg", ".webp"]', '".jpeg", ".webp", ".avif"]');
    },
  },
  {
    id: 'evidence-redaction', scope: 'repo-ops', needle: 'SECRET_KEY = re.compile(',
    manifests: ['package.json'], extra: [],
    probe: 'repo-ops/phase2-change-probe.py',
    code: `import json, pathlib, subprocess, sys, tempfile
with tempfile.TemporaryDirectory() as directory:
    path = pathlib.Path(directory) / 'synthetic.json'
    path.write_text(json.dumps({'session_id': 'synthetic-session-id', 'message': 'synthetic-session-id', 'public': 'preserve', 'token': 'synthetic-existing-token'}))
    subprocess.run([sys.executable, sys.argv[1], '--redact', directory], check=True, stdout=subprocess.DEVNULL)
    result = json.loads(path.read_text())
    assert result['token'] == '[REDACTED]' and result['public'] == 'preserve'
    assert result['session_id'] == '[REDACTED]' and result['message'] == '[REDACTED]', 'new acceptance: redact session ID and copies'
`,
    edit: s => {
      assert.ok(s.includes('authorization|credential'));
      return s.replace('authorization|credential', 'authorization|credential|session[_-]?id');
    },
  },
];
function run(cwd, argv, trace) {
  const start = performance.now();
  const result = spawnSync(argv[0], argv.slice(1), { cwd, env, encoding: 'utf8', timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  trace.push({ command: argv, exit: result.status, elapsedMs: Math.round(performance.now() - start),
    output: (result.stdout + result.stderr).slice(-4000), ...(result.error && { error: String(result.error) }) });
  if (result.error) throw result.error;
  return result;
}
try {
  for (const [label, revision] of [['baseline', baseline], ['candidate', candidate]]) {
    const cwd = join(scratch, label);
    git(source, ['worktree','add','--detach',cwd,revision]);
    worktrees.push(cwd);
    const setup = [];
    const installed = run(cwd, ['bun','--no-env-file','install','--frozen-lockfile','--ignore-scripts'], setup);
    report.results.push({ label, revision, tree: git(cwd, ['rev-parse','HEAD^{tree}']), setup, tasks: [] });
    const result = report.results.at(-1);
    assert.equal(installed.status, 0, 'frozen install failed');
    for (const task of tasks) {
      const record = { id: task.id, reads: [], edits: [], commands: [], status: 'OPEN' };
      result.tasks.push(record);
      const read = path => {
        if (!existsSync(join(cwd, path))) return null;
        const bytes = readFileSync(join(cwd,path));
        if (!record.reads.some(x => x.path === path)) record.reads.push({ path, bytes: bytes.length });
        return bytes.toString();
      };
      read('AGENTS.md');
      for (const p of task.manifests) read(p);
      const query = ['git','grep','-l','-F','-e',task.needle,'HEAD','--',task.scope,':(exclude,glob)**/.env*',':(exclude,glob)**/.env*/**'];
      const discovered = run(cwd, query, record.commands);
      assert.equal(discovered.status, 0);
      const matches = discovered.stdout.trim().split('\n').map(line => line.replace(/^HEAD:/,''));
      assert.equal(matches.length, 1, JSON.stringify(matches));
      const target = matches[0];
      const original = read(target);
      for (const p of task.extra) read(p);
      assert.ok(original);
      const changed = task.edit(original);
      assert.notEqual(changed, original);
      const probe = join(cwd, task.probe);
      mkdirSync(dirname(probe), { recursive: true });
      writeFileSync(probe, task.code, { flag: 'wx', mode: 0o600 });
      const args = task.id === 'evidence-redaction'
        ? ['python3', task.probe, target]
        : ['bun','--no-env-file',task.probe];
      try {
        const before = run(cwd, args, record.commands);
        assert.notEqual(before.status, 0, 'negative control must fail before change');
        assert.match(before.stdout + before.stderr, /new acceptance:/);
        writeFileSync(join(cwd,target), changed);
        record.edits.push({ path: target, bytesBefore: Buffer.byteLength(original), bytesAfter: Buffer.byteLength(changed) });
        const after = run(cwd, args, record.commands);
        assert.equal(after.status, 0, 'positive control failed');
        record.status = 'VERIFIED';
      } finally {
        writeFileSync(join(cwd,target), original);
        rmSync(probe);
        record.contextBytes = record.reads.reduce((sum, row) => sum + row.bytes, 0);
        record.owner = task.scope.startsWith('repo-ops') ? target.split('/').slice(0,2).join('/') : task.scope.split('/').slice(0,3).join('/');
        record.rollbackClean = git(cwd, ['status','--porcelain','--untracked-files=all']) === '';
      }
      assert.equal(record.rollbackClean, true, 'disposable worktree not restored');
    }
  }
} finally {
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  for (const cwd of worktrees.reverse()) git(source, ['worktree','remove','--force',cwd]);
  rmSync(scratch, { recursive: true, force: true });
}
