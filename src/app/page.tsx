import { getTranslations } from 'next-intl/server'

import { LinkList } from '@/components/common/link-list'
import { ProfileCard } from '@/components/common/profile-card'
import { Section } from '@/components/common/section'
import {
  TableOfContents,
  type TocSection,
} from '@/components/common/table-of-contents'
import { YearlyGoals } from '@/components/common/yearly-goals'
import {
  KeyboardSettings,
  MonitorSettings,
  OsuBestScores,
  TabletSettings,
} from '@/components/osu'
import { TwitterCarousel } from '@/components/social/twitter-carousel'
import { YouTubeCarousel } from '@/components/social/youtube-carousel'
import { TWEETS } from '@/data/twitter'
import { YOUTUBE_PERSONAL_BEST_HISTORY, YOUTUBE_VIDEOS } from '@/data/youtube'

import type { PropsWithChildren } from 'react'

// Define keys for sections
const SectionKeys = {
  OSU_BEST_SCORES: 'osu-best-scores',
  YEARLY_GOALS: 'yearly-goals',
  PERSONAL_BEST_HISTORY: 'personal-best-history',
  FEATURED_VIDEOS: 'featured-videos',
  TWITTER_CLIPS: 'twitter-clips',
  OSU_SETTINGS: 'osu-settings',
  MY_LINKS: 'my-links',
} as const

type SectionKey = (typeof SectionKeys)[keyof typeof SectionKeys]

// for osu contents
export const revalidate = 60

export default async function Home() {
  const t = await getTranslations()

  const SectionHeader = ({ children }: PropsWithChildren) => {
    return (
      <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
        {children}
      </h2>
    )
  }

  // Define sections for TOC using keys and translations
  const tocSections: Record<SectionKey, TocSection> = {
    [SectionKeys.OSU_BEST_SCORES]: {
      id: SectionKeys.OSU_BEST_SCORES,
      title: t('sections.osuBestScores'),
    },
    [SectionKeys.YEARLY_GOALS]: {
      id: SectionKeys.YEARLY_GOALS,
      title: t('sections.yearlyGoals'),
    },
    [SectionKeys.PERSONAL_BEST_HISTORY]: {
      id: SectionKeys.PERSONAL_BEST_HISTORY,
      title: t('sections.personalBestHistory'),
    },
    [SectionKeys.FEATURED_VIDEOS]: {
      id: SectionKeys.FEATURED_VIDEOS,
      title: t('sections.featuredVideos'),
    },
    [SectionKeys.TWITTER_CLIPS]: {
      id: SectionKeys.TWITTER_CLIPS,
      title: t('sections.twitterClips'),
    },
    [SectionKeys.OSU_SETTINGS]: {
      id: SectionKeys.OSU_SETTINGS,
      title: t('sections.osuSettings'),
    },
    [SectionKeys.MY_LINKS]: {
      id: SectionKeys.MY_LINKS,
      title: t('sections.myLinks'),
    },
  }

  return (
    <div className="flex flex-col items-center">
      <Section className="w-full">
        <ProfileCard />
      </Section>

      <TableOfContents sections={Object.values(tocSections)} />

      <div className="grid w-full max-w-4xl grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-4 md:gap-y-0">
        {/* Access sections by key */}
        <Section id={tocSections[SectionKeys.OSU_BEST_SCORES].id}>
          <SectionHeader>
            {tocSections[SectionKeys.OSU_BEST_SCORES].title}
          </SectionHeader>
          <OsuBestScores />
        </Section>

        <Section id={tocSections[SectionKeys.YEARLY_GOALS].id}>
          <SectionHeader>
            {tocSections[SectionKeys.YEARLY_GOALS].title}
          </SectionHeader>
          <YearlyGoals />
        </Section>
      </div>

      <Section
        className="w-full"
        id={tocSections[SectionKeys.PERSONAL_BEST_HISTORY].id}
      >
        <SectionHeader>
          {tocSections[SectionKeys.PERSONAL_BEST_HISTORY].title}
        </SectionHeader>
        <YouTubeCarousel videos={YOUTUBE_PERSONAL_BEST_HISTORY} />
      </Section>

      <Section
        className="w-full"
        id={tocSections[SectionKeys.FEATURED_VIDEOS].id}
      >
        <SectionHeader>
          {tocSections[SectionKeys.FEATURED_VIDEOS].title}
        </SectionHeader>
        <YouTubeCarousel videos={YOUTUBE_VIDEOS} type="video" />
      </Section>

      <Section
        className="w-full"
        id={tocSections[SectionKeys.TWITTER_CLIPS].id}
      >
        <SectionHeader>
          {tocSections[SectionKeys.TWITTER_CLIPS].title}
        </SectionHeader>
        <span className="block text-center text-xs">
          {t('sections.twitterNote')}
        </span>
        <TwitterCarousel tweets={TWEETS} />
      </Section>

      <Section className="w-full" id={tocSections[SectionKeys.OSU_SETTINGS].id}>
        <SectionHeader>
          {tocSections[SectionKeys.OSU_SETTINGS].title}
        </SectionHeader>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <TabletSettings />
          <KeyboardSettings />
          <MonitorSettings />
        </div>
      </Section>

      <Section className="w-full" id={tocSections[SectionKeys.MY_LINKS].id}>
        <SectionHeader>{tocSections[SectionKeys.MY_LINKS].title}</SectionHeader>
        <LinkList />
      </Section>
    </div>
  )
}
