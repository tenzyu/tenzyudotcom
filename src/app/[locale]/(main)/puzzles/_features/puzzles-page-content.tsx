import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import type { PuzzleCategoryWithOgp } from './types'
import { PuzzleTile } from './puzzle-tile'

type PuzzlesPageContentProps = {
  categories: PuzzleCategoryWithOgp[]
}

export function PuzzlesPageContent({ categories }: PuzzlesPageContentProps) {
  const content = useIntlayer('page-puzzles')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />

      {categories.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{content.empty.title}</EmptyTitle>
            <EmptyDescription>{content.empty.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {categories.map((category) => {
            const categoryCopy = content.categories[category.id]
            if (!categoryCopy) return null

            return (
              <section key={category.id} className="flex flex-col gap-4">
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
    </>
  )
}
