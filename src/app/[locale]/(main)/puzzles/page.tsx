import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { getPuzzleCategoriesWithOgp } from './_features/get-puzzle-categories-with-ogp'
import { PuzzlesPageContent } from './_features/puzzles-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-puzzles', {
  pathname: '/puzzles',
})

const PuzzlesPage: NextPageIntlayer = async ({ params }) => {
  const [locale, categories] = await Promise.all([
    resolvePageLocale(params),
    getPuzzleCategoriesWithOgp(),
  ])

  return (
    <IntlayerServerProvider locale={locale}>
      <PuzzlesPageContent categories={categories} />
    </IntlayerServerProvider>
  )
}

export default PuzzlesPage
