import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import { z } from 'zod'
import { editorialRepository } from '@/lib/editorial/editorial.contract'
import type { PuzzleCategory } from './puzzles.domain'
import type { PuzzlesRepository } from './puzzles.port'

const PuzzleLinkSchema = z.object({
  platform: z.enum(['web', 'ios', 'android', 'steam', 'switch', 'other']),
  url: z.string().trim().min(1),
})

const PuzzleSchema = z.object({
  title: z.string().trim().min(1),
  url: z.string().trim().min(1).optional(),
  links: z.array(PuzzleLinkSchema),
})

const PuzzleCategorySchema = z.object({
  id: z.enum(['web', 'mobile', 'other']),
  puzzles: z.array(PuzzleSchema),
})

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
      assertNonEmpty(
        puzzle.title,
        `puzzle title in category ${category.id}`,
      )

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

export function parsePuzzleSourceCategories(raw: unknown) {
  const categories = z.array(PuzzleCategorySchema).parse(raw)
  return definePuzzleCategories(categories)
}

export class EditorialPuzzlesRepository implements PuzzlesRepository {
  async loadAll(): Promise<readonly PuzzleCategory[]> {
    const { collection } = await editorialRepository.loadState('puzzles')
    return collection
  }
}

export const puzzlesRepository = new EditorialPuzzlesRepository()
