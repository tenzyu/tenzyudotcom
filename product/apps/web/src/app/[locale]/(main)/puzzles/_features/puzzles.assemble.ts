import {
  definePuzzleCategories,
} from './puzzles.domain'
import type { PuzzleCategory } from './puzzles.domain'
import type { PuzzlesRepository } from './puzzles.port'
import { makePuzzlesRepository } from './puzzles.infra'

export type {
  Platform,
  
  PuzzleCategory,
  PuzzleLink,
} from './puzzles.domain'

class LoadPuzzlesUseCase {
  constructor(private repository: PuzzlesRepository) {}

  async execute(): Promise<readonly PuzzleCategory[]> {
    return definePuzzleCategories(await this.repository.loadAll())
  }
}

function makeLoadPuzzlesUseCase() {
  return new LoadPuzzlesUseCase(makePuzzlesRepository())
}

export async function loadPuzzleCategories() {
  const useCase = makeLoadPuzzlesUseCase()
  return useCase.execute()
}
