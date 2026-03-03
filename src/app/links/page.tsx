import { LinkList } from '@/components/common/link-list'
import { PageHeader } from '@/components/common/page-header'

export const dynamic = 'force-static'

export default function LinkTreePage() {
  return (
    <main className="flex flex-col items-center p-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-8">
        <PageHeader
          title="Links"
          description="各種リンクをまとめています。"
          className="px-4"
        />
        <LinkList />
      </div>
    </main>
  )
}
