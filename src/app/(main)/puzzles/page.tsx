import { PageHeader } from '@/components/common/page-header'
import { SectionHeader } from '@/components/common/section-header'
import { PUZZLE_CATEGORIES } from '@/data/puzzles'

import type { Metadata } from 'next'

import { PuzzleCard } from './_components/puzzle-card'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Puzzles',
  description: '解いた謎解きのアプリやウェブサイトを紹介しています。',
}

export default function PuzzlesPage() {
  const nonEmptyCategories = PUZZLE_CATEGORIES.filter(
    (category) => category.puzzles.length > 0,
  )

  return (
    <>
      <PageHeader
        title="Puzzles"
        description="解いた謎解きのアプリやウェブサイトを紹介しています。"
      />

      {nonEmptyCategories.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          まだ謎解きが追加されていません。
        </p>
      ) : (
        <div className="space-y-10">
          {nonEmptyCategories.map((category) => (
            <section key={category.name} className="space-y-4">
              <SectionHeader
                title={category.name}
                description={category.description}
              />
              <div className="grid gap-3">
                {category.puzzles.map((puzzle) => (
                  <PuzzleCard key={puzzle.url} puzzle={puzzle} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
