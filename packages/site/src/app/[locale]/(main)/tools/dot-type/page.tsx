import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import ClientWrapper from './_features/client-wrapper'
import { DotTypeContent } from './_features/client'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-dot-type', {
  pathname: '/tools/dot-type',
})

const DotTypePage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <ClientWrapper>
        <DotTypeContent />
      </ClientWrapper>
    </IntlayerServerProvider>
  )
}
export default DotTypePage
