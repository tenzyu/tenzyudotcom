export type Platform = 'web' | 'ios' | 'android' | 'steam' | 'switch' | 'other'

export type PuzzleLink = {
  platform: Platform
  url: string
}

export type Puzzle = {
  title: string
  url?: string
  links: PuzzleLink[]
}

export type PuzzleCategory = {
  id: 'web' | 'mobile' | 'other'
  puzzles: Puzzle[]
}
