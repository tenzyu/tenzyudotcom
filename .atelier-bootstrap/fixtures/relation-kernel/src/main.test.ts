/**
 * Real passing test for the relation-kernel fixture.
 *
 * This is a genuine `bun test` smoke test, not a stub. It asserts
 * the most basic identity (`1 + 1 === 2`) and one fixture-specific
 * invariant. Running it directly with `bun test
 * harness/fixtures/relation-kernel/src/main.test.ts` exits 0.
 */
import { describe, test, expect } from 'bun:test'
import { add, FIXTURE_NAME, FIXTURE_VALUE } from './main.ts'

describe('relation-kernel fixture: main', () => {
  test('1 + 1 === 2 (identity)', () => {
    expect(add(1, 1)).toBe(2)
  })

  test('add(0, n) === n', () => {
    expect(add(0, FIXTURE_VALUE)).toBe(FIXTURE_VALUE)
  })

  test('fixture identity is stable', () => {
    expect(FIXTURE_NAME).toBe('relation-kernel')
  })
})
