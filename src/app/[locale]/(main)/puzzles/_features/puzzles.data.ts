import { definePuzzleCategories } from './puzzles.contract'

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

const puzzleCategories: PuzzleCategory[] = [
  {
    id: 'web',
    puzzles: [
      {
        title: 'push',
        links: [{ platform: 'web', url: 'https://o24.works/push' }],
      },
    ],
  },
  {
    id: 'mobile',
    puzzles: [
      {
        title: 'green',
        links: [
          {
            platform: 'ios',
            url: 'https://apps.apple.com/jp/app/green-game/id1502106711',
          },
          {
            platform: 'android',
            url: 'https://play.google.com/store/apps/details?id=air.com.bartbonte.green',
          },
        ],
      },
      {
        title: 'purple',
        links: [
          {
            platform: 'ios',
            url: 'https://apps.apple.com/jp/app/purple-game/id6503608929',
          },
          {
            platform: 'android',
            url: 'https://play.google.com/store/apps/details?id=air.com.bartbonte.purple',
          },
        ],
      },
      {
        title: 'pink',
        links: [
          {
            platform: 'ios',
            url: 'https://apps.apple.com/jp/app/pink-game/id1548980409',
          },
          {
            platform: 'android',
            url: 'https://play.google.com/store/apps/details?id=air.com.bartbonte.pink',
          },
        ],
      },
    ],
  },
  {
    id: 'other',
    puzzles: [],
  },
]

export const PUZZLE_CATEGORIES = definePuzzleCategories(puzzleCategories)
