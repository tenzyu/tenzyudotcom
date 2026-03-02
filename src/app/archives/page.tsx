import Link from 'next/link'

export default function ArchivesPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8 text-center md:text-left">
        <section className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Archives</h1>
          <p className="text-muted-foreground text-sm">
            過去のコンテンツや古いバージョンのページのアーカイブ。
          </p>
        </section>

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
    </div>
  )
}
