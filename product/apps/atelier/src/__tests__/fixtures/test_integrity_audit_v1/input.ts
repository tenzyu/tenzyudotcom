export const testIntegrityAuditInput = {
  fixtureId: 'test_integrity_audit_v1',
  repoRelativeFiles: [
    'product/apps/atelier/src/__tests__/fixture-alias-consistency.test.ts',
    'product/apps/atelier/src/__tests__/coverage-fixture.test.ts',
    'product/apps/atelier/src/__tests__/test-integrity-audit-fixture.test.ts',
    'product/apps/atelier/src/__tests__/fixtures/coverage_v1/command.ts',
    'product/apps/atelier/src/__tests__/fixtures/test_integrity_audit_v1/command.ts',
    'harness/knowledge/implementation-control/atelier/canonical/assertion-links.ndjson',
    'harness/knowledge/implementation-control/atelier/canonical/fixtures.yaml',
    'harness/knowledge/implementation-control/atelier/canonical/gates.yaml',
    'harness/knowledge/implementation-control/atelier/canonical/validation-profiles.yaml',
  ],
  forbiddenPatterns: [
    {
      pattern: '\\b(?:describe|test|it)\\.skip\\s*\\(',
      reason: 'skipped tests weaken VG-038 coverage',
    },
    {
      pattern: '\\b(?:describe|test|it)\\.only\\s*\\(',
      reason: 'focused tests exclude the rest of the suite',
    },
    {
      pattern: 'fixture_not_yet_implemented: (coverage_v1|test_integrity_audit_v1)',
      reason: 'DAG-02 fixtures must not remain fail-closed placeholders',
    },
  ],
  requiredSubstrings: [
    {
      file: 'product/apps/atelier/src/__tests__/fixture-alias-consistency.test.ts',
      text: 'views/VALIDATION_GATE_REGISTRY.md',
      reason: 'fixture alias test reads the current rendered gate registry',
    },
    {
      file: 'product/apps/atelier/src/__tests__/coverage-fixture.test.ts',
      text: 'expect(result.failures).toEqual([])',
      reason: 'coverage fixture test asserts no hidden failure list',
    },
    {
      file: 'product/apps/atelier/src/__tests__/fixtures/coverage_v1/command.ts',
      text: 'legacy_unresolved',
      reason: 'coverage command rejects unresolved legacy links',
    },
    {
      file: 'product/apps/atelier/src/__tests__/fixtures/coverage_v1/command.ts',
      text: 'requiredExecutableFixtureFailures',
      reason: 'coverage command verifies required fixtures are executable',
    },
    {
      file: 'harness/knowledge/implementation-control/atelier/canonical/assertion-links.ndjson',
      text: '"link_id":"LNK-DAG-02-3560CA0AC0"',
      reason: 'DAG-02 link remains present in canonical coverage state',
    },
    {
      file: 'harness/knowledge/implementation-control/atelier/canonical/assertion-links.ndjson',
      text: '"link_id":"LNK-DAG-02A-DC3DD4D16D"',
      reason: 'DAG-02A link remains present in canonical coverage state',
    },
  ],
} as const
