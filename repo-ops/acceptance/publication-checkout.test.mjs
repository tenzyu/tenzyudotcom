import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { archivePublicationCheckout, gitRevision } from './publication-checkout.mjs';

test('publication checkout is commit-bound and excludes untracked and dotenv paths', () => {
  const root = mkdtempSync(join(tmpdir(), 'publication-snapshot-'));
  const repo = join(root, 'repo');
  const output = join(root, 'output');
  mkdirSync(repo);
  mkdirSync(output);
  const git = (...args) => execFileSync('git', args, { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git('init', '--object-format=sha1');
    git('config', 'user.name', 'Synthetic fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    writeFileSync(join(repo, 'tracked.txt'), 'committed');
    // A synthetic filename, never actual dotenv credentials.
    writeFileSync(join(repo, '.env.fixture'), 'synthetic excluded content');
    git('add', 'tracked.txt', '.env.fixture');
    git('commit', '-m', 'fixture');
    const first = gitRevision(repo, 'HEAD');
    writeFileSync(join(repo, 'tracked.txt'), 'dirty working tree');
    writeFileSync(join(repo, 'untracked.txt'), 'not part of the candidate');
    archivePublicationCheckout(repo, output, first.commit);
    assert.equal(readFileSync(join(output, 'tracked.txt'), 'utf8'), 'committed');
    assert.equal(existsSync(join(output, 'untracked.txt')), false);
    assert.equal(existsSync(join(output, '.env.fixture')), false);
    assert.equal(first.tree, git('rev-parse', 'HEAD^{tree}').toString().trim());

    symlinkSync('tracked.txt', join(repo, 'alias'));
    git('add', 'alias');
    git('commit', '-m', 'unsupported symlink');
    assert.throws(() => archivePublicationCheckout(repo, output, gitRevision(repo, 'HEAD').commit), /Unsupported publication checkout entry/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
