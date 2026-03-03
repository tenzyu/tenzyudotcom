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

export default async function Home() {
  const t = await getTranslations('home')

  return (
    <>
      {/* Hero & Profile Section */}
      <section className="relative space-y-8 pt-8 text-center">
        <div className="flex items-center">
          <div className="border-background ring-primary/20 mx-auto h-36 w-36 overflow-hidden rounded-full border-2 shadow-2xl ring-4">
            <Image
              src="/images/ltvgbz.jpg"
              alt="Profile"
              width={144}
              height={144}
              priority
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            />
          </div>
          <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="from-primary bg-gradient-to-r via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
              {t('catchphrase')}
            </span>
          </h1>
        </div>

        <div className="items-center justify-center space-y-6">
          <div className="flex items-center gap-6">
            <p className="text-foreground text-3xl font-bold">夢</p>
            <Badge
              variant="secondary"
              className="items-center justify-center px-2 py-1 text-sm font-medium"
            >
              {t('realName')}
            </Badge>

            <Button
              asChild
              className="group rounded-full shadow-md transition-all hover:shadow-lg"
            >
              <a
                href="https://x.com/FlawInAffection"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span className="font-bold">FlawInAffection on X</span>
              </a>
            </Button>
          </div>
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
          <YouTubeCarousel videos={HOME_VIDEOS} type="video" />
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
