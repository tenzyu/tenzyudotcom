import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { RecommendationsPageContent } from './_features/recommendations-page-content'
import { getRecommendationsPageData } from './_lib/get-recommendations-page-data'

export const dynamic = 'force-static'
export const generateMetadata = createPageMetadata('page-recommendations', {
  pathname: '/recommendations',
})

const RecommendationsPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  const { channels, videos } = await getRecommendationsPageData(locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <RecommendationsPageContent channels={channels} videos={videos} />
    </IntlayerServerProvider>
  )
}

export default RecommendationsPage
