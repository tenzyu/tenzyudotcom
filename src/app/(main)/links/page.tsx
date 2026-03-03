import { LinkList } from '@/components/common/link-list'
import { PageHeader } from '@/components/common/page-header'

export const dynamic = 'force-static'

export default function LinkTreePage() {
  return (
    <>
      <PageHeader title="Links" description="各種リンクをまとめています。" />
      <LinkList />
    </>
  )
}
