import { describe, expect, test } from 'bun:test'
import {
  definePuzzleCategories,
  PUZZLE_CATEGORY_IDS,
} from './puzzles.domain'
import { parsePuzzleSourceCategories } from './puzzles.infra'

describe('definePuzzleCategories', () => {
  test('inserts missing categories in canonical order', () => {
    const categories = definePuzzleCategories([
      {
        id: 'mobile',
        puzzles: [],
      },
      {
        id: 'other',
        puzzles: [],
      },
    ])

    expect(categories.map((category) => category.id)).toEqual([...PUZZLE_CATEGORY_IDS])
    expect(categories.find((category) => category.id === 'escape')?.puzzles).toEqual([])
  })
})

describe('parsePuzzleSourceCategories', () => {
  test('accepts escape category and normalizes category order', () => {
    const categories = parsePuzzleSourceCategories([
      {
        id: 'other',
        puzzles: [],
      },
      {
        id: 'escape',
        puzzles: [
          {
            title: 'Room',
            links: [
              {
                platform: 'web',
                url: 'https://example.com',
              },
            ],
          },
        ],
      },
    ])

    expect(categories.map((category) => category.id)).toEqual([...PUZZLE_CATEGORY_IDS])
    expect(categories.find((category) => category.id === 'escape')?.puzzles).toHaveLength(1)
  })
})
