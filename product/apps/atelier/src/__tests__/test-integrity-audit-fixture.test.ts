import { describe, expect, test } from 'bun:test'
import { runTestIntegrityAuditFixture } from './fixtures/test_integrity_audit_v1/command'
import { testIntegrityAuditExpected } from './fixtures/test_integrity_audit_v1/expected'

describe('test integrity audit fixture (VG-038)', () => {
  test('DAG-02 coverage repair does not weaken tests or fixture guards', () => {
    const result = runTestIntegrityAuditFixture()

    expect(result.status).toBe(testIntegrityAuditExpected.status)
    expect(result.failures).toEqual([])
    expect(result.counts.missingInputFiles).toBe(
      testIntegrityAuditExpected.counts.missingInputFiles,
    )
    expect(result.counts.forbiddenMatches).toBe(
      testIntegrityAuditExpected.counts.forbiddenMatches,
    )
    expect(result.counts.missingRequiredSubstrings).toBe(
      testIntegrityAuditExpected.counts.missingRequiredSubstrings,
    )
  })
})
