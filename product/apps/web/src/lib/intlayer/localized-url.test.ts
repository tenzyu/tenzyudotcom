import { describe, expect, test } from 'bun:test'
import { buildLocalizedUrl } from './localized-url'

describe('buildLocalizedUrl', () => {
  test('omits the default locale prefix', () => {
    expect(buildLocalizedUrl('/notes/123', 'ja')).toBe('/notes/123')
  })

  test('adds a prefix for non-default locales', () => {
    expect(buildLocalizedUrl('/notes/123', 'en')).toBe('/en/notes/123')
  })

  test('replaces an existing locale prefix', () => {
    expect(buildLocalizedUrl('/ja/notes/123', 'en')).toBe('/en/notes/123')
  })

  test('preserves search params and hashes', () => {
    expect(buildLocalizedUrl('/blog?page=2#top', 'en')).toBe(
      '/en/blog?page=2#top',
    )
  })
})
