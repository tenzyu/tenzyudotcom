import { normalizeExternalUrl } from '@/lib/url/external-url.domain'

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

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function definePuzzleCategories<const T extends PuzzleCategory>(
  categories: readonly T[],
): readonly T[] {
  const categoryIds = new Set<string>()

  for (const category of categories) {
    assertNonEmpty(category.id, 'puzzle category id')

    if (categoryIds.has(category.id)) {
      throw new Error(`Duplicate puzzle category id: ${category.id}`)
    }
    categoryIds.add(category.id)

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

  return categories
}
