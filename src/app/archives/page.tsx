import Link from 'next/link'

import { PageHeader } from '@/components/site/page-header'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Archives',
  description: '過去のコンテンツや古いバージョンのページのアーカイブ。',
}

export default function ArchivesPage() {
  return (
    <main className="flex flex-col items-center p-4 py-8 md:py-12">
      <div className="w-full max-w-3xl space-y-8">
        <PageHeader
          title="Archives"
          description="過去のコンテンツや古いバージョンのページのアーカイブ。"
          className="px-4"
        />

        <section className="grid gap-4">
          <Link
            href="/archives/osu-profile"
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col gap-1 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <h2 className="text-lg font-semibold">osu! Profile (Legacy)</h2>
            <p className="text-muted-foreground text-sm">
              以前の「tenzyudotcom」のトップページに配置されていたosu!プロフィールのアーカイブ。
            </p>
          </Link>
        </section>
      </div>
    </main>
  )
}
