import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-12 text-center md:text-left">
        {/* Hero Section */}
        <section className="space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="from-foreground to-muted-foreground bg-gradient-to-br bg-clip-text text-transparent">
              夢持って生きろ
            </span>
          </h1>
          <div className="text-muted-foreground flex flex-col items-center gap-2 md:items-start">
            <p className="text-xl font-medium">
              夢 <span className="text-sm opacity-70">(本名 = 天珠)</span>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <span className="bg-muted/50 rounded-md px-2 py-0.5 font-mono">
                @FlawInAffection
              </span>
              <span>on X</span>
            </p>
          </div>
        </section>

        {/* Navigation Grid */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/blog"
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center gap-2 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <span className="text-sm font-medium">Blog</span>
          </Link>
          <Link
            href="/portfolio"
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center gap-2 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <span className="text-sm font-medium">Portfolio</span>
          </Link>
          <Link
            href="/tools"
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center gap-2 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <span className="text-sm font-medium">Tools</span>
          </Link>
          <Link
            href="/archives"
            className="group border-border/50 bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground flex flex-col items-center justify-center gap-2 rounded-xl border p-6 shadow-sm transition-all hover:shadow-md"
          >
            <span className="text-sm font-medium">Archives</span>
          </Link>
        </section>

        {/* Footer Link */}
        <section className="border-border/30 border-t pt-12">
          <Link
            href="/archives/osu-profile"
            className="text-muted-foreground hover:text-primary inline-flex items-center text-xs transition-colors"
          >
            tenzyudotcom時代のサイトが見たい方はこちら &rarr;
          </Link>
        </section>
      </div>
    </div>
  )
}
