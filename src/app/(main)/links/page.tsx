import { LinkList } from '@/components/common/link-list'
import { PageHeader } from '@/components/common/page-header'

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
