export type Platform = 'web' | 'ios' | 'android' | 'steam' | 'switch' | 'other'

export type Puzzle = {
  title: string
  url: string
  platforms: Platform[]
}

export type PuzzleCategory = {
  name: string
  description?: string
  puzzles: Puzzle[]
}

export const PUZZLE_CATEGORIES: PuzzleCategory[] = [
  {
    name: 'ブラウザゲーム',
    description: 'ブラウザ上で遊べる謎解き',
    puzzles: [],
  },
  {
    name: 'スマホアプリ',
    description: 'iOS / Android で遊べる謎解きアプリ',
    puzzles: [],
  },
  {
    name: 'その他',
    description: 'Steam・Switch などのプラットフォーム',
    puzzles: [],
  },
]
