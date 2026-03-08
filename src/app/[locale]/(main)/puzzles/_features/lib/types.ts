import type { PuzzleCategory, PuzzleLink } from '../../_data/puzzles'
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
