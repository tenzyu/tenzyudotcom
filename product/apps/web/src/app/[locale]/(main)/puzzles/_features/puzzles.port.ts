import type { PuzzleCategory } from './puzzles.domain'

export interface PuzzlesRepository {
  loadAll(): Promise<readonly PuzzleCategory[]>
}
