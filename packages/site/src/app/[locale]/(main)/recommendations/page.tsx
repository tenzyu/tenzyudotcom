import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { assembleRecommendationsPageData } from './_features/recommendations.assemble'
import { RecommendationsPageContent } from './_features/recommendations-page-content'

export const dynamic = 'force-static'
export const generateMetadata = createPageMetadata('page-recommendations', {
  pathname: '/recommendations',
})

const RecommendationsPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  const { channels, videos } = await assembleRecommendationsPageData(locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <RecommendationsPageContent channels={channels} videos={videos} />
    </IntlayerServerProvider>
  )
}

export default RecommendationsPage
