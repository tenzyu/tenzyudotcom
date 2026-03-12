import type { EditorRepository } from '@/lib/editor/editor.port'
import type {
  RecommendationSourceEntry,
} from '@/features/recommendations/recommendations.domain'
import type { RecommendationsRepository } from './recommendations.port'
import { RECOMMENDATIONS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/recommendations'
export { isRecommendationTabId } from '@/features/recommendations/recommendations.domain'

export class EditorRecommendationsRepository implements RecommendationsRepository {
  constructor(private readonly editorRepository: EditorRepository) {}

  async loadAll(): Promise<readonly RecommendationSourceEntry[]> {
    const { collection } = await this.editorRepository.loadState(
      RECOMMENDATIONS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}
