import { loadPuzzleCategories } from './puzzles.assemble'
import { fetchOgp } from './ogp'
import type { PuzzleCategoryWithOgp } from './types'

export async function getPuzzleCategoriesWithOgp(): Promise<
  PuzzleCategoryWithOgp[]
> {
  const categories = await loadPuzzleCategories()
  return Promise.all(
    categories.filter((category) => category.puzzles.length > 0).map(
      async (category) => {
        const puzzles = await Promise.all(
          category.puzzles.map(async (puzzle) => {
            const ogpUrl = puzzle.url ?? puzzle.links[0]?.url
            const ogp = ogpUrl ? await fetchOgp(ogpUrl) : {}

            return {
              ...puzzle,
              ogp,
            }
          }),
        )

        return {
          ...category,
          puzzles,
        }
      },
    ),
  )
}
