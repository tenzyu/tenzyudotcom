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
import { PuzzlesEditorDeferred } from '@/app/[locale]/(admin)/editor/_features/puzzles-editor-deferred'
import { Content } from '@/components/site-ui/content'
import { EditorAdminTrigger } from '@/features/admin/admin-trigger'

type PuzzlesPageContentProps = {
  categories: PuzzleCategoryWithOgp[]
}

export async function PuzzlesPageContent({ categories }: PuzzlesPageContentProps) {
  const content = useIntlayer('page-puzzles')
  const { locale } = useLocale()

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />

      <AdminGate>
        <Content size="4xl" className="mb-12">
          <div className="rounded-lg border-2 border-dashed p-4">
            <p className="mb-4 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Admin View: Puzzles
            </p>
            <PuzzlesEditorDeferred locale={locale || 'ja'} />
          </div>
          <hr className="mt-12" />
        </Content>
      </AdminGate>

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

      <AdminGate>
        <EditorAdminTrigger locale={locale || 'ja'} collectionId="puzzles" />
      </AdminGate>
    </>
  )
}
