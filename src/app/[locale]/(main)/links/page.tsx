import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { LinkList } from '@/components/features/links/link-list'
import { PageHeader } from '@/components/site/page-header'
import {
  createPageMetadata,
  resolvePageLocale,
} from '@/lib/intlayer/page'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('linksPage', {
  pathname: '/links',
})

const LinkTreePageContent = () => {
  const content = useIntlayer('linksPage')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <LinkList />
    </>
  )
}

const LinkTreePage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <LinkTreePageContent />
    </IntlayerServerProvider>
  )
}

export default LinkTreePage
