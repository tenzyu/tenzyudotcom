import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import { PUZZLE_CATEGORIES } from '@/data/puzzles'
import { fetchOgp } from '@/lib/ogp'

import type { PuzzleWithOgp } from './_components/puzzle-card'
import type { Metadata } from 'next'

import { PuzzleCard } from './_components/puzzle-card'

export const dynamic = 'force-static'

const title = 'Puzzles'
const description = '解いた謎解きのアプリやウェブサイトを紹介しています。'

export const metadata: Metadata = {
  title,
  description,
}

async function getPuzzleCategoriesWithOgp() {
  const categories = await Promise.all(
    PUZZLE_CATEGORIES.filter((c) => c.puzzles.length > 0).map(
      async (category) => {
        const puzzlesWithOgp: PuzzleWithOgp[] = await Promise.all(
          category.puzzles.map(async (puzzle) => {
            // Fetch OGP from the first link URL or the puzzle's main URL
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
          puzzles: puzzlesWithOgp,
        }
      },
    ),
  )

  return categories
}

export default async function PuzzlesPage() {
  const categoriesWithOgp = await getPuzzleCategoriesWithOgp()

  return (
    <>
      <PageHeader title={title} description={description} />

      {categoriesWithOgp.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          まだ謎解きが追加されていません。
        </p>
      ) : (
        <div className="space-y-10">
          {categoriesWithOgp.map((category) => (
            <section key={category.name} className="space-y-4">
              <SectionHeader
                title={category.name}
                description={category.description}
              />
              <div className="grid gap-4">
                {category.puzzles.map((puzzle) => (
                  <PuzzleCard key={puzzle.title} puzzle={puzzle} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
