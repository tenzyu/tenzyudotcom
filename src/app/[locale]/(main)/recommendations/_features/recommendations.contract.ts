import { editorRepository } from '@/lib/editor/editor.contract'
import type {
  RecommendationSourceEntry,
} from './recommendations.domain'
import type { RecommendationsRepository } from './recommendations.port'
import { RECOMMENDATIONS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/recommendations'
export {
  defineRecommendationChannels,
  defineRecommendationTabs,
  defineRecommendationVideos,
  parseRecommendationSourceEntries,
  RECOMMENDATIONS_COLLECTION_DESCRIPTOR,
} from '@/features/editor-collections/recommendations'
export { isRecommendationTabId } from './recommendations.domain'

export class EditorRecommendationsRepository implements RecommendationsRepository {
  async loadAll(): Promise<readonly RecommendationSourceEntry[]> {
    const { collection } = await editorRepository.loadState(
      RECOMMENDATIONS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}

export const recommendationsRepository = new EditorRecommendationsRepository()
