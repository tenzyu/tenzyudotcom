import { useIntlayer } from 'next-intlayer/server'
import type { PropsWithChildren } from 'react'
import { Content } from '@/components/site-ui/content'
import { Section } from '@/components/site-ui/section'
import { SectionHeader } from '@/components/site-ui/section-header'
import { LinkList } from '@/features/links/link-list'
import { TWEETS } from './data/twitter'
import {
  FEATURED_VIDEO_IDS,
  PERSONAL_BEST_HISTORY_VIDEO_IDS,
} from './data/youtube'
import { KeyboardSettings } from './osu/keyboard-settings'
import { MonitorSettings } from './osu/monitor-settings'
import { OsuBestScores } from './osu/osu-best-scores'
import { TabletSettings } from './osu/tablet-settings'
import { ProfileCard } from './profile-card'
import { TableOfContents, type TocSection } from './table-of-contents'
import { TwitterCarousel } from './twitter/twitter-carousel'
import { YearlyGoals } from './yearly-goals'
import { YouTubeCarousel } from './youtube/youtube-carousel'

const ArchiveSection = ({
  id,
  title,
  className,
  children,
}: {
  id: string
  title: string
  className?: string
} & PropsWithChildren) => (
  <Section id={id} className={className}>
    <SectionHeader
      title={title}
      variant="plain"
      className="space-y-0"
      titleClassName="mb-6 text-center"
    />
    {children}
  </Section>
)

export function OsuProfileContent() {
  const content = useIntlayer('page-osu-profile')
  const videoContent = useIntlayer('osuProfileVideos')

  const personalBestVideos = PERSONAL_BEST_HISTORY_VIDEO_IDS.map((id) => ({
    id,
    title: videoContent.titles[id].value,
  }))

  const featuredVideos = FEATURED_VIDEO_IDS.map((id) => ({
    id,
    title: videoContent.titles[id].value,
  }))

  const tocSections: TocSection[] = [
    {
      id: 'osu-best-scores',
      title: content.sections.osuBestScores.value,
    },
    { id: 'yearly-goals', title: content.sections.yearlyGoals.value },
    {
      id: 'personal-best-history',
      title: content.sections.personalBestHistory.value,
    },
    { id: 'featured-videos', title: content.sections.featuredVideos.value },
    { id: 'twitter-clips', title: content.sections.twitterClips.value },
    { id: 'osu-settings', title: content.sections.osuSettings.value },
    { id: 'my-links', title: content.sections.myLinks.value },
  ]

  return (
    <div className="flex flex-col items-center legacy-osu">
      <Content size="4xl" className="py-4">
        <p className="text-muted-foreground mt-2 text-xs">
          {content.archiveNote.value}
        </p>
      </Content>

      <Section className="w-full">
        <ProfileCard />
      </Section>

      <TableOfContents sections={tocSections} />

      <Content
        size="4xl"
        className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-4 md:gap-y-0"
      >
        <ArchiveSection
          id="osu-best-scores"
          title={content.sections.osuBestScores.value}
        >
          <OsuBestScores />
        </ArchiveSection>

        <ArchiveSection
          id="yearly-goals"
          title={content.sections.yearlyGoals.value}
        >
          <YearlyGoals />
        </ArchiveSection>
      </Content>

      <ArchiveSection
        className="w-full"
        id="personal-best-history"
        title={content.sections.personalBestHistory.value}
      >
        <YouTubeCarousel videos={personalBestVideos} />
      </ArchiveSection>

      <ArchiveSection
        className="w-full"
        id="featured-videos"
        title={content.sections.featuredVideos.value}
      >
        <YouTubeCarousel videos={featuredVideos} type="video" />
      </ArchiveSection>

      <ArchiveSection
        className="w-full"
        id="twitter-clips"
        title={content.sections.twitterClips.value}
      >
        <span className="block text-center text-xs">
          {content.sections.twitterNote.value}
        </span>
        <TwitterCarousel tweets={TWEETS} />
      </ArchiveSection>

      <ArchiveSection
        className="w-full"
        id="osu-settings"
        title={content.sections.osuSettings.value}
      >
        <Content size="4xl" className="flex flex-col gap-4">
          <TabletSettings />
          <KeyboardSettings />
          <MonitorSettings />
        </Content>
      </ArchiveSection>

      <ArchiveSection
        className="w-full"
        id="my-links"
        title={content.sections.myLinks.value}
      >
        <LinkList />
      </ArchiveSection>
    </div>
  )
}
