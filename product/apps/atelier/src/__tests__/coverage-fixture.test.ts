import { describe, expect, test } from 'bun:test'
import { runCoverageFixture } from './fixtures/coverage_v1/command'
import { coverageFixtureExpected } from './fixtures/coverage_v1/expected'

describe('coverage fixture (VG-029)', () => {
  test('canonical executable assertions have concrete coverage links', () => {
    const result = runCoverageFixture()

    expect(result.status).toBe(coverageFixtureExpected.status)
    expect(result.failures).toEqual([])
    expect(result.counts.unresolvedExecutableAssertions).toBe(
      coverageFixtureExpected.counts.unresolvedExecutableAssertions,
    )
    expect(result.counts.danglingReferences).toBe(
      coverageFixtureExpected.counts.danglingReferences,
    )
    expect(result.counts.legacyUnresolvedLinks).toBe(
      coverageFixtureExpected.counts.legacyUnresolvedLinks,
    )
    expect(result.counts.requiredLinkStatusFailures).toBe(
      coverageFixtureExpected.counts.requiredLinkStatusFailures,
    )
    expect(result.counts.requiredExecutableFixtureFailures).toBe(
      coverageFixtureExpected.counts.requiredExecutableFixtureFailures,
    )
  })
})
