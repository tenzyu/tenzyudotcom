import { IntlayerServerProvider } from 'next-intlayer/server'
import {
  getIntlayer,
  LocalPromiseParams,
  NextPageIntlayer,
} from 'next-intlayer'
import { Metadata } from 'next'

import { LinkList } from '@/components/features/links/link-list'
import { PageHeader } from '@/components/site/page-header'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('linksPage', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

const LinkTreePage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = getIntlayer('linksPage', locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <LinkList />
    </IntlayerServerProvider>
  )
}

export default LinkTreePage
