import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import type { PropsWithChildren } from 'react'
import { Content } from '@/components/site/content'
import { Section } from '@/components/site/section'
import { LinkList } from '@/features/links/link-list'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { TWEETS } from './_data/twitter'
import {
  KeyboardSettings,
  MonitorSettings,
  OsuBestScores,
  TabletSettings,
} from './_features/osu'
import { ProfileCard } from './_features/profile-card'
import { TableOfContents, type TocSection } from './_features/table-of-contents'
import { TwitterCarousel } from './_features/twitter-carousel'
import { YearlyGoals } from './_features/yearly-goals'
import { YouTubeCarousel } from './_features/youtube-carousel'

import './legacy.css'

export const revalidate = 60

export const generateMetadata = createPageMetadata('page-osu-profile', {
  pathname: '/archives/osu-profile',
})

const SectionHeader = ({ children }: PropsWithChildren) => (
  <h2 className="mb-6 text-center text-2xl font-bold tracking-tight">
    {children}
  </h2>
)

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
    <SectionHeader>{title}</SectionHeader>
    {children}
  </Section>
)

const OsuProfileArchiveContent = () => {
  const content = useIntlayer('page-osu-profile')
  const videoContent = useIntlayer('osuProfileVideos')

  const personalBestVideos = videoContent.personalBestHistory.map((video) => ({
    id: video.id.value,
    title: video.title.value,
  }))

  const featuredVideos = videoContent.featuredVideos.map((video) => ({
    id: video.id.value,
    title: video.title.value,
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

const OsuProfileArchive: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <OsuProfileArchiveContent />
    </IntlayerServerProvider>
  )
}

export default OsuProfileArchive
