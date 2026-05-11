import { normalizeExternalUrl } from '@/lib/url/external-url.domain'

export type Platform = 'web' | 'ios' | 'android' | 'steam' | 'switch' | 'other'
export type PuzzleCategoryId = 'web' | 'mobile' | 'escape' | 'other'

export const PUZZLE_CATEGORY_IDS: readonly PuzzleCategoryId[] = [
  'web',
  'mobile',
  'escape',
  'other',
]

export type PuzzleLink = {
  platform: Platform
  url: string
}

type Puzzle = {
  title: string
  url?: string
  links: PuzzleLink[]
}

export type PuzzleCategory = {
  id: PuzzleCategoryId
  puzzles: Puzzle[]
}

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function definePuzzleCategories(
  categories: readonly PuzzleCategory[],
): readonly PuzzleCategory[] {
  const categoryIds = new Set<string>()
  const categoryById = new Map<PuzzleCategoryId, PuzzleCategory>()

  for (const category of categories) {
    assertNonEmpty(category.id, 'puzzle category id')

    if (categoryIds.has(category.id)) {
      throw new Error(`Duplicate puzzle category id: ${category.id}`)
    }
    categoryIds.add(category.id)
    categoryById.set(category.id, category)

    for (const puzzle of category.puzzles) {
      assertNonEmpty(puzzle.title, `puzzle title in category ${category.id}`)

      if (puzzle.url) {
        normalizeExternalUrl(
          puzzle.url,
          `puzzle url for ${category.id}/${puzzle.title}`,
        )
      }

      for (const link of puzzle.links) {
        normalizeExternalUrl(
          link.url,
          `puzzle link url for ${category.id}/${puzzle.title}/${link.platform}`,
        )
      }
    }
  }

  return PUZZLE_CATEGORY_IDS.map(
    (categoryId) =>
      categoryById.get(categoryId) ??
      {
        id: categoryId,
        puzzles: [],
      },
  )
}
