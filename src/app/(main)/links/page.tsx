import { LinkList } from '@/components/features/links/link-list'
import { PageHeader } from '@/components/site/page-header'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Links',
  description: '各種リンクをまとめています。',
}

export default function LinkTreePage() {
  return (
    <>
      <PageHeader title="Links" description="各種リンクをまとめています。" />
      <LinkList />
    </>
  )
}
