import assert from 'node:assert/strict';
import { test } from 'node:test';
import { auditStatus } from './audit-status.mjs';
const advisory = JSON.stringify({ minimatch: [{ id: 1, vulnerable_versions: '<11.0.1', severity: 'moderate' }] });
test('distinguishes a clean scanner response from a confirmed advisory', () => {
  assert.deepEqual(auditStatus('{}', 0), { status: 'no-advisories-reported', count: 0 });
  assert.deepEqual(auditStatus(advisory, 1), { status: 'advisories-found', count: 1 });
});
test('fails closed for scanner errors, missing data and inconsistent statuses', () => {
  for (const [raw, code, stderr] of [['', 1], ['{}', 1], ['{}', 2], ['{}', 0, 'network error'], ['[]', 0], ['{"error":"request failed"}', 1], [advisory, 0]]) {
    assert.throws(() => auditStatus(raw, code, stderr));
  }
});
