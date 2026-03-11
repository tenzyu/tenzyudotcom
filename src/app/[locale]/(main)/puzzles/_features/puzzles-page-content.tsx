import { useIntlayer, useLocale } from 'next-intlayer/server'
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
import { AdminGate } from '@/features/admin/admin-gate'
import { PuzzleAddButton } from './puzzle-add-button'
import { PuzzleAdminMenu } from './puzzle-admin-menu'

type PuzzlesPageContentProps = {
  categories: PuzzleCategoryWithOgp[]
}

export async function PuzzlesPageContent({ categories }: PuzzlesPageContentProps) {
  const content = useIntlayer('page-puzzles')
  const { locale } = useLocale()
  const resolvedLocale = locale || 'ja'

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
            const categoryId = category.id as keyof typeof content.categories
            const categoryCopy = content.categories[categoryId]
            if (!categoryCopy) return null

            return (
              <section key={category.id} className="flex flex-col gap-4">
                <div className="space-y-3">
                  <SectionHeader
                    title={categoryCopy.name.value}
                    description={categoryCopy.description.value}
                  />
                  <AdminGate>
                    <div className="flex justify-end">
                      <PuzzleAddButton locale={resolvedLocale} categoryId={category.id} />
                    </div>
                  </AdminGate>
                </div>
                <div className="grid gap-4">
                  {category.puzzles.map((puzzle, index) => (
                    <div key={puzzle.title} className="relative">
                      <AdminGate>
                        <div className="absolute top-3 right-3 z-10">
                          <PuzzleAdminMenu
                            locale={resolvedLocale}
                            categoryId={category.id}
                            puzzleIndex={index}
                            label={puzzle.title}
                          />
                        </div>
                      </AdminGate>
                      <PuzzleTile puzzle={puzzle} />
                    </div>
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
