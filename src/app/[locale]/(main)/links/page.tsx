import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { LinkList } from '@/features/links/link-list'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-links', {
  pathname: '/links',
})

const LinkTreePageContent = () => {
  const content = useIntlayer('page-links')

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
