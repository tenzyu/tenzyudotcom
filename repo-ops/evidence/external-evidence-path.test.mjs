import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { externalEvidencePath } from './external-evidence-path.mjs';

test('external evidence resolves existing symlink prefixes and rejects overlap', () => {
  const parent = mkdtempSync(join(tmpdir(), 'evidence-path-'));
  try {
    const repo = join(parent, 'repo');
    const outside = join(parent, 'outside');
    mkdirSync(repo);
    mkdirSync(outside);
    symlinkSync(repo, join(parent, 'alias'));
    symlinkSync(outside, join(parent, 'safe-alias'));
    symlinkSync(join(parent, 'missing'), join(parent, 'dangling'));
    assert.equal(externalEvidencePath(repo, join(parent, 'safe-alias', 'new', 'nested')), join(outside, 'new', 'nested'));
    for (const dest of [repo, join(repo, 'new'), join(parent, 'alias', 'new', 'nested'), parent]) {
      assert.throws(() => externalEvidencePath(repo, dest), /outside the checkout/);
    }
    assert.throws(() => externalEvidencePath(repo, join(parent, 'dangling', 'new')));
    // Publication allocates an exclusive mkdtemp child under a shared root.
    assert.equal(externalEvidencePath(repo, parent, { disjoint: false }), parent);
    assert.throws(() => externalEvidencePath(repo, join(parent, 'alias', 'new'), { disjoint: false }));
  } finally { rmSync(parent, { recursive: true, force: true }); }
});
