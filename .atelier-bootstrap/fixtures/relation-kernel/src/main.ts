/**
 * Relation-kernel fixture: a minimal real testable surface that the
 * live indexer can scan and the transform pipeline can materialize a
 * ready TestContract against.
 *
 * The fixture lives under `harness/fixtures/relation-kernel/**` (NOT
 * under `.atelier-bootstrap/**`) so the live indexer includes both
 * files in its known source universe. The companion
 * `main.test.ts` is a real `bun test` smoke test that asserts the
 * arithmetic identity `1 + 1 === 2` — the smallest meaningful
 * passing test that exercises the contract's `command: 'bun test'`.
 *
 * No production code is exercised by this fixture. The file exists
 * to give the relation kernel a non-fixture, non-product
 * testable surface bound to a deterministic verifying relation.
 */
export function add(a: number, b: number): number {
  return a + b
}

export const FIXTURE_NAME = 'relation-kernel'

export const FIXTURE_VALUE = 42
