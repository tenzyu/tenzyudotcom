import {
  getLocale,
  IntlayerServerProvider,
  useIntlayer,
} from 'next-intlayer/server'
import type { PropsWithChildren } from 'react'
import { LinkList } from '@/components/features/links/link-list'
import { TwitterCarousel } from '@/components/features/social/twitter-carousel'
import { YouTubeCarousel } from '@/components/features/social/youtube-carousel'
import { Content } from '@/components/site/content'
import { Section } from '@/components/site/section'
import {
  KeyboardSettings,
  MonitorSettings,
  OsuBestScores,
  TabletSettings,
} from './_components/osu'
import { ProfileCard } from './_components/profile-card'
import {
  TableOfContents,
  type TocSection,
} from './_components/table-of-contents'
import { YearlyGoals } from './_components/yearly-goals'
import { TWEETS } from './_data/twitter'

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

export async function generateMetadata() {
  const locale = await getLocale()
  const content = useIntlayer('osuProfilePage', locale)
  const videoContent = useIntlayer('osuProfileVideos', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

export default async function OsuProfileArchive() {
  const locale = await getLocale()
  const content = useIntlayer('osuProfilePage', locale)
  const videoContent = useIntlayer('osuProfileVideos', locale)

  const getText = (value: { value: string } | string) =>
    typeof value === 'string' ? value : value.value

  const personalBestVideos = videoContent.personalBestHistory.map((video) => ({
    id: getText(video.id),
    title: getText(video.title),
  }))

  const featuredVideos = videoContent.featuredVideos.map((video) => ({
    id: getText(video.id),
    title: getText(video.title),
  }))

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
      title: content.sections.osuBestScores.value,
    },
    [SectionKeys.YEARLY_GOALS]: {
      id: SectionKeys.YEARLY_GOALS,
      title: content.sections.yearlyGoals.value,
    },
    [SectionKeys.PERSONAL_BEST_HISTORY]: {
      id: SectionKeys.PERSONAL_BEST_HISTORY,
      title: content.sections.personalBestHistory.value,
    },
    [SectionKeys.FEATURED_VIDEOS]: {
      id: SectionKeys.FEATURED_VIDEOS,
      title: content.sections.featuredVideos.value,
    },
    [SectionKeys.TWITTER_CLIPS]: {
      id: SectionKeys.TWITTER_CLIPS,
      title: content.sections.twitterClips.value,
    },
    [SectionKeys.OSU_SETTINGS]: {
      id: SectionKeys.OSU_SETTINGS,
      title: content.sections.osuSettings.value,
    },
    [SectionKeys.MY_LINKS]: {
      id: SectionKeys.MY_LINKS,
      title: content.sections.myLinks.value,
    },
  }

  return (
    <IntlayerServerProvider locale={locale}>
      <div className="legacy-osu" />
      <div className="flex flex-col items-center">
        <Content size="4xl" className="py-4">
          <p className="text-muted-foreground mt-2 text-xs">
            {content.archiveNote.value}
          </p>
        </Content>

        <Section className="w-full">
          <ProfileCard />
        </Section>

        <TableOfContents sections={Object.values(tocSections)} />

        <Content
          size="4xl"
          className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-4 md:gap-y-0"
        >
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
        </Content>

        <Section
          className="w-full"
          id={tocSections[SectionKeys.PERSONAL_BEST_HISTORY].id}
        >
          <SectionHeader>
            {tocSections[SectionKeys.PERSONAL_BEST_HISTORY].title}
          </SectionHeader>
          <YouTubeCarousel videos={personalBestVideos} />
        </Section>

        <Section
          className="w-full"
          id={tocSections[SectionKeys.FEATURED_VIDEOS].id}
        >
          <SectionHeader>
            {tocSections[SectionKeys.FEATURED_VIDEOS].title}
          </SectionHeader>
          <YouTubeCarousel videos={featuredVideos} type="video" />
        </Section>

        <Section
          className="w-full"
          id={tocSections[SectionKeys.TWITTER_CLIPS].id}
        >
          <SectionHeader>
            {tocSections[SectionKeys.TWITTER_CLIPS].title}
          </SectionHeader>
          <span className="block text-center text-xs">
            {content.sections.twitterNote.value}
          </span>
          <TwitterCarousel tweets={TWEETS} />
        </Section>

        <Section
          className="w-full"
          id={tocSections[SectionKeys.OSU_SETTINGS].id}
        >
          <SectionHeader>
            {tocSections[SectionKeys.OSU_SETTINGS].title}
          </SectionHeader>
          <Content size="4xl" className="space-y-4">
            <TabletSettings />
            <KeyboardSettings />
            <MonitorSettings />
          </Content>
        </Section>

        <Section className="w-full" id={tocSections[SectionKeys.MY_LINKS].id}>
          <SectionHeader>
            {tocSections[SectionKeys.MY_LINKS].title}
          </SectionHeader>
          <LinkList />
        </Section>
      </div>
    </IntlayerServerProvider>
  )
}
