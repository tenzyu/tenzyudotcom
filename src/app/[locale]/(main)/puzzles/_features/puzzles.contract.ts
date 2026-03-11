import { editorRepository } from '@/lib/editor/editor.contract'
import type { PuzzleCategory } from './puzzles.domain'
import type { PuzzlesRepository } from './puzzles.port'
import { PUZZLES_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/puzzles'
export {
  definePuzzleCategories,
  parsePuzzleSourceCategories,
  PUZZLES_COLLECTION_DESCRIPTOR,
} from '@/features/editor-collections/puzzles'

export class EditorPuzzlesRepository implements PuzzlesRepository {
  async loadAll(): Promise<readonly PuzzleCategory[]> {
    const { collection } = await editorRepository.loadState(
      PUZZLES_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}

export const puzzlesRepository = new EditorPuzzlesRepository()
