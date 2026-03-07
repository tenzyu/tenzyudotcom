import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { HomePageContent } from './_components/home-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('home', {
  pathname: '/',
  select: (content) => content.metadata,
})

const HomePage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <HomePageContent locale={locale} />
    </IntlayerServerProvider>
  )
}

export default HomePage
