import { describe, expect, test } from 'bun:test'
import { formatRelativeNoteTime } from './note-relative-time'

const now = Date.parse('2026-11-14T12:00:00.000Z')

describe('formatRelativeNoteTime', () => {
  test('formats elapsed hours and days for both locales', () => {
    const twoHoursAgo = new Date(now - 2 * 60 * 60_000).toISOString()
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60_000).toISOString()

    expect(formatRelativeNoteTime(twoHoursAgo, 'ja', now)).toBe('2時間前')
    expect(formatRelativeNoteTime(twoHoursAgo, 'en', now)).toBe('2h ago')
    expect(formatRelativeNoteTime(twoDaysAgo, 'ja', now)).toBe('2日前')
    expect(formatRelativeNoteTime(twoDaysAgo, 'en', now)).toBe('2d ago')
  })

  test('moves from hours to days as the shared clock advances', () => {
    const createdAt = new Date(now - 23 * 60 * 60_000).toISOString()

    expect(formatRelativeNoteTime(createdAt, 'en', now)).toBe('23h ago')
    expect(formatRelativeNoteTime(createdAt, 'en', now + 60 * 60_000)).toBe('1d ago')
  })

  test('preserves the existing minimum-hour label for a future timestamp', () => {
    expect(formatRelativeNoteTime(new Date(now + 1_000).toISOString(), 'ja', now)).toBe('1時間前')
  })
})
