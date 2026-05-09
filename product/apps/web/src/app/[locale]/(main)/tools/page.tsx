import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { ToolsPageContent } from './_features/tools-page-content'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-tools', {
  pathname: '/tools',
})

const ToolsPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <ToolsPageContent locale={locale} />
    </IntlayerServerProvider>
  )
}

export default ToolsPage
