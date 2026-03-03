import { Hammer } from 'lucide-react'

import { PageHeader } from '@/components/common/page-header'

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        title="Tools"
        description="自作したツールや便利スクリプトの公開用ページ（Coming Soon）"
      />

      <section className="text-muted-foreground flex flex-col items-center justify-center py-20">
        <Hammer className="mb-4 h-12 w-12 opacity-50" />
        <p>現在準備中です。徐々にツールを公開していきます。</p>
      </section>
    </>
  )
}
