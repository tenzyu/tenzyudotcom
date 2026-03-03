import { Hammer } from 'lucide-react'

import { BackToHome } from '@/components/common/back-to-home'

export default function ToolsPage() {
  return (
    <main className="flex flex-col items-center p-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-8">
        <BackToHome />
        <div className="border-border/50 space-y-2 border-b px-4 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground text-sm">
            自作したツールや便利スクリプトの公開用ページ（Coming Soon）
          </p>
        </div>

        <section className="text-muted-foreground flex flex-col items-center justify-center py-20">
          <Hammer className="mb-4 h-12 w-12 opacity-50" />
          <p>現在準備中です。徐々にツールを公開していきます。</p>
        </section>

        <BackToHome />
      </div>
    </main>
  )
}
