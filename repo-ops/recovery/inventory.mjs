import { execFileSync } from 'node:child_process';
import { lstatSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const [rootArg, outputArg] = process.argv.slice(2);
if (!rootArg || !outputArg) throw new Error('Usage: node inventory.mjs REPO NEW_OUTPUT_JSON');
const root = resolve(rootArg);
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const tracked = new Set(git('ls-files', '-z').split('\0').filter(Boolean));
const ignored = new Set(git('ls-files', '--others', '--ignored', '--exclude-standard', '-z').split('\0').filter(Boolean));
const pruned = new Set(['.git', 'node_modules', '.next', '.nx', '.intlayer', 'target', 'storybook-static', '.worktrees']);
const entries = [];
const packages = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = join(dir, item.name);
    const path = relative(root, full);
    const stat = lstatSync(full);
    const state = tracked.has(path) ? 'tracked' : ignored.has(path) ? 'ignored' : 'untracked';
    if (item.isSymbolicLink()) {
      entries.push({ path, kind: 'symlink', state, target: readlinkSync(full) });
    } else if (item.isDirectory()) {
      if (pruned.has(item.name)) entries.push({ path, kind: 'directory', coverage: 'pruned; backup separately' });
      else walk(full);
    } else if (item.isFile()) {
      const kind = item.name !== '.env-sample' && /(^|\/)\.env|\.(pem|key|p12)$/.test(path) ? 'secret-location'
        : path.startsWith('product/apps/web/src/app/') && /(^|\/)(page|route)\.[cm]?[jt]sx?$/.test(path) ? 'route'
        : /\.(test|spec)\.[cm]?[jt]sx?$/.test(path) ? 'test'
        : /\.(png|jpe?g|webp|gif|svg|ico|mp[34]|wav|ogg|woff2?)$/i.test(path) ? 'media'
        : /\.(db|sqlite3?|mdx|csv|jsonl)$/.test(path) ? 'data'
        : /(^|\/)(SKILL|AGENTS)\.md$/.test(path) ? 'instruction' : 'file';
      entries.push({ path, kind, state, bytes: stat.size });
      if (path.startsWith('product/') && item.name === 'package.json' && !path.includes('/dist/')) {
        const pkg = JSON.parse(readFileSync(full, 'utf8'));
        packages.push({ path, name: pkg.name, scripts: pkg.scripts, dependencies: pkg.dependencies, devDependencies: pkg.devDependencies });
      }
    }
  }
}
walk(root);
const result = {
  schemaVersion: 1, root, observedAt: new Date().toISOString(),
  head: git('rev-parse', 'HEAD').trim(), status: git('status', '--porcelain=v1', '--untracked-files=all'),
  branches: git('for-each-ref', '--format=%(refname) %(objectname)', 'refs/heads', 'refs/remotes', 'refs/tags').trim().split('\n'),
  prunedNames: [...pruned], entries, packages,
  summary: Object.fromEntries([...new Set(entries.map((e) => e.kind))].map((kind) => [kind, entries.filter((e) => e.kind === kind).length])),
};
writeFileSync(resolve(outputArg), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ head: result.head, summary: result.summary, packages: packages.map((p) => p.name) }));
