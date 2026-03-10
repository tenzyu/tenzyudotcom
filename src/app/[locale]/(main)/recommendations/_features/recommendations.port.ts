import type { RecommendationSourceEntry } from './recommendations.domain'

export interface RecommendationsRepository {
  loadAll(): Promise<readonly RecommendationSourceEntry[]>
}
