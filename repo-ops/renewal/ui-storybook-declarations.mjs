import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';

const sources = [
  'package.json', 'bun.lock', 'nx.json', ':(glob)tsconfig*.json',
  ':(glob)product/apps/*/package.json', ':(glob)product/packages/*/package.json',
  'product/packages/ui/package.json', 'product/packages/ui/project.json',
  ':(glob)product/packages/ui/tsconfig*.json', 'product/packages/ui/vite.config.mts',
  'product/packages/ui/src', 'product/packages/ui/.storybook',
];

function run(command, args, cwd, env) {
  try {
    return execFileSync(command, args, {
      cwd,
      env,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    throw new Error(`${command} ${args.join(' ')} failed\n${error.stdout ?? ''}\n${error.stderr ?? ''}`, { cause: error });
  }
}

function declarations(dir, root = dir, result = {}) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) declarations(file, root, result);
    else if (entry.isFile() && entry.name.endsWith('.d.ts')) {
      result[relative(root, file)] = createHash('sha256').update(readFileSync(file)).digest('hex');
    }
  }
  return result;
}

// Runs real builds in a private copy; requires git, bun, and registry access.
export function verifyStorybookDeclarations(sourceRoot) {
  const temp = mkdtempSync(join(existsSync('/tmp/opencode') ? '/tmp/opencode' : tmpdir(), 'ui-declarations-'));
  try {
    const copy = join(temp, 'repo');
    const env = {
      PATH: process.env.PATH, HOME: temp, TMPDIR: temp,
      XDG_CACHE_HOME: join(temp, 'cache'), XDG_CONFIG_HOME: join(temp, 'config'),
      GIT_CONFIG_NOSYSTEM: '1', NX_LOAD_DOT_ENV_FILES: 'false', STORYBOOK_DISABLE_TELEMETRY: '1',
    };
    const files = run('git', ['ls-files', '-z', '--', ...sources], sourceRoot, env).split('\0').filter(Boolean);
    assert.ok(files.includes('product/packages/ui/vite.config.mts'), 'UI configuration must be tracked');
    for (const file of files) {
      assert.ok(!file.split('/').some((part) => part.startsWith('.env')), 'dotenv files are forbidden');
      const source = join(sourceRoot, file);
      assert.ok(lstatSync(source).isFile() && realpathSync(source) === source, `not a regular non-symlink source: ${file}`);
      const target = join(copy, file);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(source, target);
    }
    run('bun', ['--no-env-file', 'install', '--frozen-lockfile', '--filter', '@tenzyu/ui', '--filter', 'tenzyudotcom'], copy, env);
    const ui = join(copy, 'product/packages/ui');
    const buildEnv = { ...env, PATH: `${join(copy, 'node_modules/.bin')}:${env.PATH}` };
    run('bun', ['--no-env-file', 'run', '--shell=bun', 'build'], ui, buildEnv);
    const dist = join(ui, 'dist');
    const input = readFileSync(join(dist, 'src/components/ui/input.d.ts'), 'utf8');
    assert.match(input, /from\s+['"]react['"]/);
    assert.doesNotMatch(input, /node_modules[\\/]/);
    const before = declarations(dist);
    assert.ok(Object.keys(before).length > 0, 'UI build must produce declarations');
    run('bun', ['--no-env-file', 'run', '--shell=bun', 'build:storybook', '--output-dir', join(temp, 'storybook')], ui, buildEnv);
    assert.deepEqual(declarations(dist), before, 'Storybook must not change UI declarations');
    return Object.keys(before).length;
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
