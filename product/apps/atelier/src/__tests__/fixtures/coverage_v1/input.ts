export const coverageFixtureInput = {
  fixtureId: 'coverage_v1',
  canonicalRoot: 'harness/knowledge/implementation-control/atelier/canonical',
  assertionsPath:
    'harness/knowledge/implementation-control/atelier/canonical/assertions.ndjson',
  assertionLinksPath:
    'harness/knowledge/implementation-control/atelier/canonical/assertion-links.ndjson',
  dagPath: 'harness/knowledge/implementation-control/atelier/canonical/dag.yaml',
  gatesPath: 'harness/knowledge/implementation-control/atelier/canonical/gates.yaml',
  fixturesPath:
    'harness/knowledge/implementation-control/atelier/canonical/fixtures.yaml',
  coveredModalities: ['must', 'must_not', 'invariant'],
  executableTestability: 'executable',
  fixtureSentinel: 'N/A',
  requiredLinkedLinkIds: [
    'LNK-DAG-02-3560CA0AC0',
    'LNK-DAG-02A-DC3DD4D16D',
  ],
  requiredExecutableFixtureIds: ['coverage_v1', 'test_integrity_audit_v1'],
} as const
