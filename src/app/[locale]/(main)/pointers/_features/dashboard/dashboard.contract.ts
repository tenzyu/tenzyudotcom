import { editorRepository } from '@/lib/editor/editor.contract'
import type {
  DashboardSourceCategory,
} from './dashboard.domain'
import type { PointersRepository } from './dashboard.port'
import { POINTERS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/pointers'
export {
  defineDashboardCategories,
  parseDashboardSourceCategories,
  POINTERS_COLLECTION_DESCRIPTOR,
} from '@/features/editor-collections/pointers'

export class EditorPointersRepository implements PointersRepository {
  async loadAll(): Promise<readonly DashboardSourceCategory[]> {
    const { collection } = await editorRepository.loadState(
      POINTERS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}

export const pointersRepository = new EditorPointersRepository()
