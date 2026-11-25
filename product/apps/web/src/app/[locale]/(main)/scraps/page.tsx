import { connection } from 'next/server'
import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { loadPublication } from '@/platform/content-store/publication.assemble'
import { loadPublicScraps } from '@/features/scraps/scraps.assemble'
import { ScrapsPageContent } from '@/features/scraps/scraps-page-content'

export const generateMetadata = createPageMetadata('page-scraps', {
  pathname: '/scraps',
})

const ScrapsPage: NextPageIntlayer = async ({ params }) => {
  await connection()
  const locale = await resolvePageLocale(params)
  const scraps = await loadPublicScraps(await loadPublication())

  return (
    <IntlayerServerProvider locale={locale}>
      <ScrapsPageContent locale={locale} scraps={scraps} />
    </IntlayerServerProvider>
  )
}

export default ScrapsPage
