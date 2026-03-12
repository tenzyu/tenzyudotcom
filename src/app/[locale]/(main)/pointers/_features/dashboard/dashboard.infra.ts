import type { EditorRepository } from '@/lib/editor/editor.port'
import type {
  DashboardSourceCategory,
} from './dashboard.domain'
import type { PointersRepository } from './dashboard.port'
import { POINTERS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/pointers'

export class EditorPointersRepository implements PointersRepository {
  constructor(private readonly editorRepository: EditorRepository) {}

  async loadAll(): Promise<readonly DashboardSourceCategory[]> {
    const { collection } = await this.editorRepository.loadState(
      POINTERS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}
