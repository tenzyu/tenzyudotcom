import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { SectionHeader } from '@/components/common/section-header'
import { NavigationGrid } from '@/components/home/navigation-grid'
import { TimelineSection } from '@/components/home/timeline-section'
import { Badge } from '@/components/shadcn-ui/badge'
import { Button } from '@/components/shadcn-ui/button'
import { Card } from '@/components/shadcn-ui/card'
import { YouTubeCarousel } from '@/components/social/youtube-carousel'
import { HOME_VIDEOS } from '@/data/home'
import { fetchYouTubeTitle } from '@/lib/youtube'

export default async function Home() {
  const t = await getTranslations('home')

  const videosWithTitles = await Promise.all(
    HOME_VIDEOS.map(async (v) => ({
      id: v.id,
      title: await fetchYouTubeTitle(v.id),
    })),
  )

  return (
    <>
      {/* Hero & Profile Section */}
      <section className="relative flex flex-col items-center justify-center gap-8 py-12 text-center sm:py-20">
        <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-3xl" />
          <div className="border-border/50 bg-background relative h-full w-full overflow-hidden rounded-full border shadow-2xl ring-1 ring-black/5 transition-transform duration-700 hover:scale-105 dark:ring-white/5">
            <Image
              src="/images/ltvgbz.jpg"
              alt="Profile"
              width={176}
              height={176}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-7xl">
            <span className="from-foreground via-foreground/90 to-muted-foreground bg-gradient-to-br bg-clip-text text-transparent drop-shadow-sm">
              {t('catchphrase')}
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <div className="border-border/40 bg-card/60 flex items-center gap-3 rounded-full border px-5 py-2 pr-3 shadow-sm backdrop-blur-md">
            <span className="text-foreground text-sm font-bold tracking-widest">
              夢
            </span>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 font-semibold tracking-wider uppercase transition-colors"
            >
              {t('realName')}
            </Badge>
          </div>

          <Button
            asChild
            variant="outline"
            className="group border-border/40 bg-card/60 hover:border-primary/40 hover:bg-primary/5 rounded-full px-6 shadow-sm backdrop-blur-md transition-all duration-300"
          >
            <a
              href="https://x.com/FlawInAffection"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <span className="text-muted-foreground group-hover:text-foreground font-semibold transition-colors">
                @FlawInAffection
              </span>
            </a>
          </Button>
        </div>
      </section>

      <NavigationGrid />

      <section className="space-y-6">
        <p className="text-muted-foreground text-sm font-medium italic">
          {t('slogan')}
        </p>
      </section>

      <TimelineSection title={t('timeline')} description={t('timelineDesc')} />

      {/* Music Recommendations Section */}
      <section className="space-y-6">
        <SectionHeader title={t('music')} description={t('musicDesc')} />

        <Card className="bg-card/50 overflow-hidden p-6 shadow-sm">
          <YouTubeCarousel videos={videosWithTitles as any} type="video" />
        </Card>
      </section>

      {/* Footer Link to Archive */}
      <section className="flex justify-center pt-8">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-primary"
        >
          <Link href="/archives/osu-profile">{t('archiveLink')}</Link>
        </Button>
      </section>
    </>
  )
}
