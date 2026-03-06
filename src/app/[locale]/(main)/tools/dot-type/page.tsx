import { IntlayerServerProvider } from 'next-intlayer/server'

import {
  getIntlayer,
  LocalPromiseParams,
  NextPageIntlayer,
} from 'next-intlayer'
import { Metadata } from 'next'
import ClientWrapper from '@/components/features/client-wrapper'
import { DotTypeContent } from './_components/client'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const { metadata } = getIntlayer('dotType', locale)

  return {
    title: metadata.title.value,
    description: metadata.description.value,
  }
}

const DotTypePage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params

  return (
    <IntlayerServerProvider locale={locale}>
      <ClientWrapper>
        <DotTypeContent />
      </ClientWrapper>
    </IntlayerServerProvider>
  )
}
export default DotTypePage
