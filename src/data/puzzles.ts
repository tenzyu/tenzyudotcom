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
  name: string
  description?: string
  puzzles: Puzzle[]
}

export const PUZZLE_CATEGORIES: PuzzleCategory[] = [
  {
    name: 'ブラウザゲーム',
    description: 'ブラウザ上で遊べる謎解き',
    puzzles: [
      {
        title: 'push',
        links: [{ platform: 'web', url: 'https://o24.works/push' }],
      },
    ],
  },
  {
    name: 'スマホアプリ',
    description: 'iOS / Android で遊べる謎解きアプリ',
    puzzles: [
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
    ],
  },
  {
    name: 'その他',
    description: 'Steam・Switch などのプラットフォーム',
    puzzles: [],
  },
]
