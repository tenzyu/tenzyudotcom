import { getIntlayer } from 'intlayer'
import type { Metadata } from 'next'
import type { LocalPromiseParams, NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'

import { LinkList } from '@/components/features/links/link-list'
import { PageHeader } from '@/components/site/page-header'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('linksPage', locale)

  return {
    title: content.metadata.title,
    description: content.metadata.description,
  }
}

const LinkTreePage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = getIntlayer('linksPage', locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <PageHeader
        title={content.metadata.title}
        description={content.metadata.description}
      />
      <LinkList />
    </IntlayerServerProvider>
  )
}

export default LinkTreePage
