import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { ArchivesPageContent } from './_features/archives-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-archives', {
  pathname: '/archives',
})

const ArchivesPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <ArchivesPageContent locale={locale} />
    </IntlayerServerProvider>
  )
}

export default ArchivesPage
