import type { RecommendationTabId } from '@/features/recommendations/recommendations.domain'

export const RECOMMENDATION_TAB_PARAM = 'tab'
export const DEFAULT_RECOMMENDATION_TAB: RecommendationTabId = 'music'

export function parseRecommendationTabParam(
  value: string | null | undefined,
): RecommendationTabId {
  return value === 'channels' ? 'channels' : DEFAULT_RECOMMENDATION_TAB
}

export function applyRecommendationTabParam(
  params: URLSearchParams,
  value: RecommendationTabId,
) {
  if (value === DEFAULT_RECOMMENDATION_TAB) {
    params.delete(RECOMMENDATION_TAB_PARAM)
    return
  }

  params.set(RECOMMENDATION_TAB_PARAM, value)
}
