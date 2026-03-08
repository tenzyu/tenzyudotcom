import { describe, expect, test } from 'bun:test'
import {
  applyRecommendationTabParam,
  DEFAULT_RECOMMENDATION_TAB,
  parseRecommendationTabParam,
  RECOMMENDATION_TAB_PARAM,
} from './recommendation-search-params.contract'

describe('recommendation search params contract', () => {
  test('falls back to the default tab for unknown values', () => {
    expect(parseRecommendationTabParam(null)).toBe(DEFAULT_RECOMMENDATION_TAB)
    expect(parseRecommendationTabParam('unknown')).toBe(
      DEFAULT_RECOMMENDATION_TAB,
    )
  })

  test('serializes non-default tabs and removes the default tab', () => {
    const params = new URLSearchParams()

    applyRecommendationTabParam(params, 'channels')
    expect(params.get(RECOMMENDATION_TAB_PARAM)).toBe('channels')

    applyRecommendationTabParam(params, DEFAULT_RECOMMENDATION_TAB)
    expect(params.has(RECOMMENDATION_TAB_PARAM)).toBe(false)
  })
})
