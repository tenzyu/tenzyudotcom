import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { PointersPageContent } from './_features/pointers-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-pointers', {
  pathname: '/pointers',
})

const PointersPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <PointersPageContent />
    </IntlayerServerProvider>
  )
}

export default PointersPage
