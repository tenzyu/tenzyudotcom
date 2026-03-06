import { IntlayerServerProvider, getLocale, useIntlayer } from 'next-intlayer/server'

import { LinkList } from '@/components/features/links/link-list'
import { PageHeader } from '@/components/site/page-header'

export const dynamic = 'force-static'

export async function generateMetadata() {
  const locale = await getLocale()
  const content = useIntlayer('linksPage', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

export default async function LinkTreePage() {
  const locale = await getLocale()
  const content = useIntlayer('linksPage', locale)

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
