import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { LinkList } from '@/features/links/link-list'

export function LinkTreePageContent() {
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
