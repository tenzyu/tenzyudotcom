import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { loadPublicScraps } from './_features/scraps.assemble'
import { ScrapsPageContent } from './_features/scraps-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-scraps', {
  pathname: '/scraps',
})

const ScrapsPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  const scraps = await loadPublicScraps()

  return (
    <IntlayerServerProvider locale={locale}>
      <ScrapsPageContent locale={locale} scraps={scraps} />
    </IntlayerServerProvider>
  )
}

export default ScrapsPage
