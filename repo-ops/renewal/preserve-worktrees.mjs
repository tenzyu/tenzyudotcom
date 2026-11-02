import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const [repository, destination] = process.argv.slice(2);
if (!repository || !destination) throw new Error('Usage: node preserve-worktrees.mjs REPOSITORY NEW_EXTERNAL_DIRECTORY');
const root = resolve(repository);
const out = resolve(destination);
const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}: ${result.stderr}`);
  return result.stdout;
};
const worktrees = run('git', ['worktree', 'list', '--porcelain', '-z']).split('\0\0').filter(Boolean).map((record) => {
  const fields = record.split('\0');
  return {
    path: fields.find((field) => field.startsWith('worktree ')).slice(9),
    head: fields.find((field) => field.startsWith('HEAD '))?.slice(5),
    branch: fields.find((field) => field.startsWith('branch '))?.slice(7) ?? null,
  };
});
if (worktrees.some(({ path }) => out === path || out.startsWith(`${path}/`))) {
  throw new Error('Preservation must be outside every worktree');
}
process.umask(0o077);
mkdirSync(out, { mode: 0o700 });
const artifacts = [];
async function record(name) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(`${out}/${name}`)) hash.update(chunk);
  artifacts.push({ name, sha256: hash.digest('hex') });
}
const excluded = ['.git', 'node_modules', '.next', '.nx', '.intlayer', 'dist', 'target', 'coverage', 'storybook-static', '.cache', '.turbo', '__pycache__', '*.tsbuildinfo'];
for (const [index, tree] of worktrees.entries()) {
  tree.status = run('git', ['status', '--porcelain', '--untracked-files=all', '--ignored=matching'], tree.path);
  tree.archive = `${index}-${basename(tree.path)}.tar`;
  run('tar', ['--create', '--file', `${out}/${tree.archive}`, ...excluded.map((name) => `--exclude=${name}`), '--directory', tree.path, '.']);
  run('tar', ['--compare', '--file', `${out}/${tree.archive}`, '--directory', tree.path]);
  tree.comparedWithSource = true;
  await record(tree.archive);
}
run('git', ['bundle', 'create', `${out}/all-refs.bundle`, '--all']);
run('git', ['bundle', 'verify', `${out}/all-refs.bundle`]);
await record('all-refs.bundle');
const commonDirectory = resolve(root, run('git', ['rev-parse', '--git-common-dir']).trim());
run('tar', ['--create', '--file', `${out}/git-metadata.tar`, '--directory', dirname(commonDirectory), basename(commonDirectory)]);
run('tar', ['--compare', '--file', `${out}/git-metadata.tar`, '--directory', dirname(commonDirectory)]);
await record('git-metadata.tar');
const manifest = { createdAt: new Date().toISOString(), root, excluded, worktrees, refs: run('git', ['show-ref']), artifacts };
writeFileSync(`${out}/manifest.json`, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ manifest: `${out}/manifest.json`, comparedWorktrees: worktrees.length, artifacts: artifacts.length }));
