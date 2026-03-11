import {
  definePuzzleCategories,
  puzzlesRepository,
} from './puzzles.contract'
import type { PuzzleCategory } from './puzzles.domain'
import type { PuzzlesRepository } from './puzzles.port'

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
  return new LoadPuzzlesUseCase(puzzlesRepository)
}

export async function loadPuzzleCategories() {
  const useCase = makeLoadPuzzlesUseCase()
  return useCase.execute()
}
