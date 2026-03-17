import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { PortfolioPageContent } from './_features/portfolio-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-portfolio', {
  pathname: '/portfolio',
})

const PortfolioPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <PortfolioPageContent />
    </IntlayerServerProvider>
  )
}

export default PortfolioPage
