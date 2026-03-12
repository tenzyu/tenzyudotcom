import type { RecommendationSourceEntry } from '@/features/recommendations/recommendations.domain'

export interface RecommendationsRepository {
  loadAll(): Promise<readonly RecommendationSourceEntry[]>
}
