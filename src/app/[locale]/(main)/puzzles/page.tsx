import { getIntlayer } from 'intlayer'
import type { Metadata } from 'next'
import type { LocalPromiseParams, NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { PUZZLE_CATEGORIES } from '@/data/puzzles'
import { fetchOgp } from '@/lib/ogp'

import type { PuzzleWithOgp } from './_components/puzzle-tile'
import { PuzzleTile } from './_components/puzzle-tile'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('puzzlesPage', locale)

  return {
    title: content.metadata.title,
    description: content.metadata.description,
  }
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

const PuzzlesPage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = useIntlayer('puzzlesPage', locale)
  const categoriesWithOgp = await getPuzzleCategoriesWithOgp()

  return (
    <IntlayerServerProvider locale={locale}>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />

      {categoriesWithOgp.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{content.empty.title}</EmptyTitle>
            <EmptyDescription>{content.empty.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-10">
          {categoriesWithOgp.map((category) => {
            const categoryCopy = content.categories[category.id]
            if (!categoryCopy) return null
            return (
              <section key={category.id} className="space-y-4">
                <SectionHeader
                  title={categoryCopy.name.value}
                  description={categoryCopy.description.value}
                />
                <div className="grid gap-4">
                  {category.puzzles.map((puzzle) => (
                    <PuzzleTile key={puzzle.title} puzzle={puzzle} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </IntlayerServerProvider>
  )
}

export default PuzzlesPage
