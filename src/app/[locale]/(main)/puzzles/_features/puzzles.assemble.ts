import { definePuzzleCategories } from './puzzles.contract'
import { loadEditorialCollection } from '@/lib/editorial/storage'

export type {
  Platform,
  Puzzle,
  PuzzleCategory,
  PuzzleLink,
} from './puzzles.source'

export async function loadPuzzleCategories() {
  return definePuzzleCategories(await loadEditorialCollection('puzzles'))
}
