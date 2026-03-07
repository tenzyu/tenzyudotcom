import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import ClientWrapper from '@/components/features/client-wrapper'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { DotTypeContent } from './_components/client'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('dotType', {
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
