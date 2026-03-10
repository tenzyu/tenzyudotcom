import type { PuzzleCategory, PuzzleLink } from '../puzzles.assemble'
import type { OgpData } from './ogp'

export type PuzzleWithOgp = {
  title: string
  url?: string
  links: PuzzleLink[]
  ogp: OgpData
}

export type PuzzleCategoryWithOgp = Omit<PuzzleCategory, 'puzzles'> & {
  puzzles: PuzzleWithOgp[]
}
