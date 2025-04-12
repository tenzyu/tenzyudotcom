import { getTranslations } from 'next-intl/server'

import { LinkList } from '@/components/common/link-list'
import { ProfileCard } from '@/components/common/profile-card'
import { Section } from '@/components/common/section'
import { YearlyGoals } from '@/components/common/yearly-goals'
import {
  KeyboardSettings,
  MonitorSettings,
  OsuBestScores,
  TabletSettings,
} from '@/components/osu'
import { Toaster } from '@/components/shadcn-ui/sonner'
import { TwitterCarousel } from '@/components/social/twitter-carousel'
import { YouTubeCarousel } from '@/components/social/youtube-carousel'
import { TWEETS } from '@/data/twitter'
import { YOUTUBE_PERSONAL_BEST_HISTORY, YOUTUBE_VIDEOS } from '@/data/youtube'

// for osu contents
export const revalidate = 60

export default async function Home() {
  const t = await getTranslations()

  return (
    <div className="flex flex-col items-center">
      <Section className="w-full">
        <ProfileCard />
      </Section>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-4 md:gap-y-0">
        <Section>
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
            Best Scores
          </h2>
          <OsuBestScores />
        </Section>

        <Section>
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
            Yearly Goals
          </h2>
          <YearlyGoals />
        </Section>
      </div>

      <Section className="w-full">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          PERSONAL BEST HISTORY
        </h2>
        <YouTubeCarousel videos={YOUTUBE_PERSONAL_BEST_HISTORY} />
      </Section>

      <Section className="w-full">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Featured Videos
        </h2>
        <YouTubeCarousel videos={YOUTUBE_VIDEOS} type="video" />
      </Section>

      <Section className="w-full">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          Twitter Clips
        </h2>
        <span className="block text-center text-xs">
          {t('sections.twitterNote')}
        </span>
        <TwitterCarousel tweets={TWEETS} />
      </Section>

      <Section className="w-full">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          osu! settings
        </h2>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <TabletSettings />
          <KeyboardSettings />
          <MonitorSettings />
        </div>
      </Section>

      <Section className="w-full">
        <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
          My Links
        </h2>
        <LinkList />
      </Section>

      <Toaster />
    </div>
  )
}
