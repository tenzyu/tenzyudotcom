import { describe, expect, test } from 'bun:test'
import { normalizeRecommendationVideoSource } from './recommendation-source.domain'

describe('normalizeRecommendationVideoSource', () => {
  test('accepts youtu.be URLs', () => {
    expect(
      normalizeRecommendationVideoSource('https://youtu.be/Y0EcKR05Ac4'),
    ).toBe('Y0EcKR05Ac4')
  })

  test('accepts youtube watch URLs', () => {
    expect(
      normalizeRecommendationVideoSource(
        'https://www.youtube.com/watch?v=Y0EcKR05Ac4',
      ),
    ).toBe('Y0EcKR05Ac4')
  })

  test('rejects non-video URLs', () => {
    expect(() =>
      normalizeRecommendationVideoSource('https://example.com/not-youtube'),
    ).toThrow('Invalid recommendation video source')
  })
})
