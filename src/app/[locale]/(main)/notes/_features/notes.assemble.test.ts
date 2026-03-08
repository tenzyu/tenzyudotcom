import { describe, expect, test } from 'bun:test'
import { compareNotesByCreatedAtDesc } from './notes.assemble'

describe('compareNotesByCreatedAtDesc', () => {
  test('sorts by parsed timestamps instead of raw ISO strings', () => {
    const sorted = [
      { createdAt: '2026-03-08T00:30:00+09:00' },
      { createdAt: '2026-03-07T16:00:00Z' },
    ].sort(compareNotesByCreatedAtDesc)

    expect(sorted.map((note) => note.createdAt)).toEqual([
      '2026-03-07T16:00:00Z',
      '2026-03-08T00:30:00+09:00',
    ])
  })
})
