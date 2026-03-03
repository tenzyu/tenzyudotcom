import { LinkList } from '@/components/common/link-list'
import { PageHeader } from '@/components/common/page-header'

export const dynamic = 'force-static'

export default function LinkTreePage() {
  return (
    <main className="flex flex-col items-center p-4">
      <div className="container flex flex-col items-center gap-8 px-4 pt-8">
        <PageHeader title="My Links" className="border-none pb-0 text-center" />
        <LinkList />
      </div>
    </main>
  )
}
