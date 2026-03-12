import {
  definePuzzleCategories,
} from './puzzles.domain'
import type { PuzzleCategory } from './puzzles.domain'
import type { PuzzlesRepository } from './puzzles.port'
import { EditorPuzzlesRepository } from './puzzles.infra'
import { makeEditorRepository } from '@/lib/editor/editor.assemble'

export type {
  Platform,
  Puzzle,
  PuzzleCategory,
  PuzzleLink,
} from './puzzles.domain'

export class LoadPuzzlesUseCase {
  constructor(private repository: PuzzlesRepository) {}

  async execute(): Promise<readonly PuzzleCategory[]> {
    return definePuzzleCategories(await this.repository.loadAll())
  }
}

export function makeLoadPuzzlesUseCase() {
  return new LoadPuzzlesUseCase(
    new EditorPuzzlesRepository(makeEditorRepository()),
  )
}

export async function loadPuzzleCategories() {
  const useCase = makeLoadPuzzlesUseCase()
  return useCase.execute()
}
