import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { LinkTreePageContent } from './_features/link-tree-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-links', {
  pathname: '/links',
})

const LinkTreePage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <LinkTreePageContent />
    </IntlayerServerProvider>
  )
}

export default LinkTreePage
