import { describe, expect, test } from 'bun:test'
import {
  executableFixtureIds,
  runExecutableFixtureContract,
} from './fixtures/executable-fixture-contract'

describe('executable fixture command contract', () => {
  test('every executable fixture command row resolves to real files', () => {
    const failures = executableFixtureIds().flatMap(
      (fixtureId) => runExecutableFixtureContract(fixtureId).failures,
    )

    expect(failures).toEqual([])
  })
})
