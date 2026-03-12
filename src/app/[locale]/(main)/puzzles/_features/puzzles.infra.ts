import type { EditorRepository } from '@/lib/editor/editor.port'
import type { PuzzleCategory } from './puzzles.domain'
import type { PuzzlesRepository } from './puzzles.port'
import { PUZZLES_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/puzzles'

export class EditorPuzzlesRepository implements PuzzlesRepository {
  constructor(private readonly editorRepository: EditorRepository) {}

  async loadAll(): Promise<readonly PuzzleCategory[]> {
    const { collection } = await this.editorRepository.loadState(
      PUZZLES_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}
