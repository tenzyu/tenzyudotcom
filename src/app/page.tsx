import { LinkList } from '@/components/common/link-list'
import { ProfileCard } from '@/components/common/profile-card'
import { YearlyGoals } from '@/components/common/yearly-goals'
import { Section } from '@/components/layout/common/section'
import { OsuBestScores } from '@/components/osu/osu-best-scores'
import { KeyboardSettings } from '@/components/settings/keyboard-settings'
import { MonitorSettings } from '@/components/settings/monitor-settings'
import { TabletSettings } from '@/components/settings/tablet-settings'
import { TwitterCarousel } from '@/components/social/twitter-carousel'
import { YouTubeCarousel } from '@/components/social/youtube-carousel'

import { Toaster } from '@/components/shadcn-ui/sonner'

import { TWEETS } from '@/data/twitter'
import { YOUTUBE_PERSONAL_BEST_HISTORY, YOUTUBE_VIDEOS } from '@/data/youtube'

import { getUser, getUserScores } from '@/data/osu'
import { getTranslations } from 'next-intl/server'

// for osu contents
export const revalidate = 60

export default async function Home() {
  const osuProfile = await getUser('tenzyu')
  const osuMyBestScores = getUserScores(
    osuProfile.id,
    'best',
    0,
    { lazer: true },
    { limit: 5 },
  )

  const t = await getTranslations()

  return (
    <div className='flex flex-col items-center'>
      <Section className='w-full'>
        <ProfileCard osuProfile={osuProfile} />
      </Section>

      <div className='w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 md:gap-x-4 md:gap-y-0 gap-y-12'>
        <Section>
          <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
            Best Scores
          </h2>
          <OsuBestScores scores={await osuMyBestScores} />
        </Section>

        <Section>
          <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
            Yearly Goals
          </h2>
          <YearlyGoals />
        </Section>
      </div>

      <Section className='w-full'>
        <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
          PERSONAL BEST HISTORY
        </h2>
        <YouTubeCarousel videos={YOUTUBE_PERSONAL_BEST_HISTORY} />
      </Section>

      <Section className='w-full'>
        <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
          Featured Videos
        </h2>
        <YouTubeCarousel videos={YOUTUBE_VIDEOS} type='video' />
      </Section>

      <Section className='w-full'>
        <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
          Twitter Clips
        </h2>
        <span className='text-center block text-xs'>
          {t('sections.twitterNote')}
        </span>
        <TwitterCarousel tweets={TWEETS} />
      </Section>

      <Section className='w-full'>
        <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
          osu! settings
        </h2>
        <div className='w-full max-w-4xl mx-auto space-y-4'>
          <TabletSettings />
          <KeyboardSettings />
          <MonitorSettings />
        </div>
      </Section>

      <Section className='w-full'>
        <h2 className='text-2xl font-bold tracking-tight text-center mb-6'>
          My Links
        </h2>
        <LinkList />
      </Section>

      <Toaster />
    </div>
  )
}
