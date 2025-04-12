import { LinkList } from '@/components/common/link-list'

export const dynamic = 'force-static'

export default function LinkTreePage() {
  return (
    <main className="flex flex-col items-center p-4">
      <div className="container flex flex-col items-center gap-8 px-4 pt-8">
        <h1 className="text-center text-3xl font-bold tracking-tight">
          My Links
        </h1>
        <LinkList />
      </div>
    </main>
  )
}
