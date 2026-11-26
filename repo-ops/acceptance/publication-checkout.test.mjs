import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync, statSync } from 'node:fs';
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
    writeFileSync(join(repo, '.gitattributes'), 'tracked.txt export-ignore\nstamp.txt export-subst\n');
    writeFileSync(join(repo, 'stamp.txt'), '$Format:%H$\n');
    writeFileSync(join(repo, 'binary.bin'), Buffer.from([0, 10, 255, 13]));
    writeFileSync(join(repo, 'script.sh'), '#!/bin/sh\n', { mode: 0o700 });
    git('add', 'tracked.txt', '.env.fixture', '.gitattributes', 'stamp.txt', 'binary.bin', 'script.sh');
    git('commit', '-m', 'fixture');
    const first = gitRevision(repo, 'HEAD');
    writeFileSync(join(repo, 'tracked.txt'), 'dirty working tree');
    writeFileSync(join(repo, 'untracked.txt'), 'not part of the candidate');
    archivePublicationCheckout(repo, output, first.commit);
    assert.equal(readFileSync(join(output, 'tracked.txt'), 'utf8'), 'committed');
    assert.equal(readFileSync(join(output, 'stamp.txt'), 'utf8'), '$Format:%H$\n');
    assert.deepEqual(readFileSync(join(output, 'binary.bin')), Buffer.from([0, 10, 255, 13]));
    assert.ok(statSync(join(output, 'script.sh')).mode & 0o100);
    assert.equal(existsSync(join(output, 'untracked.txt')), false);
    assert.equal(existsSync(join(output, '.env.fixture')), false);
    assert.equal(first.tree, git('rev-parse', 'HEAD^{tree}').toString().trim());

    assert.throws(() => archivePublicationCheckout(repo, output, first.commit), /destination must be empty/);

    symlinkSync('tracked.txt', join(repo, 'alias'));
    git('add', 'alias');
    git('commit', '-m', 'unsupported symlink');
    const second = join(root, 'second');
    mkdirSync(second);
    assert.throws(() => archivePublicationCheckout(repo, second, gitRevision(repo, 'HEAD').commit), /Unsupported publication checkout entry/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
