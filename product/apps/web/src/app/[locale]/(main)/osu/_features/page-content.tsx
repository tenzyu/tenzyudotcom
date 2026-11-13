import { useIntlayer } from 'next-intlayer/server'
import type { PropsWithChildren } from 'react'
import { Section } from './section'
import { SectionHeader } from '@/components/site/section-header'
import { TWEETS } from './twitter.source'
import {
  FEATURED_VIDEO_IDS,
  PERSONAL_BEST_HISTORY_VIDEO_IDS,
} from './youtube.source'
import { LinkList } from './link-list'
import { SettingsByEra } from './osu/settings-by-era'
import { OsuBestScores } from './osu/osu-best-scores'
import { ProfileCard } from './profile-card'
import { TableOfContents, type TocSection } from './table-of-contents'
import { TwitterCarousel } from './twitter/twitter-carousel'
import { YouTubeCarousel } from './youtube/youtube-carousel'

const OsuSection = ({
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
      <Section className="w-full">
        <ProfileCard />
      </Section>

      <TableOfContents
        title={content.tableOfContents.value}
        sections={tocSections}
      />

      <OsuSection
        className="w-full"
        id="osu-best-scores"
        title={content.sections.osuBestScores.value}
      >
        <OsuBestScores />
      </OsuSection>

      <OsuSection
        className="w-full"
        id="personal-best-history"
        title={content.sections.personalBestHistory.value}
      >
        <YouTubeCarousel videos={personalBestVideos} />
      </OsuSection>

      <OsuSection
        className="w-full"
        id="featured-videos"
        title={content.sections.featuredVideos.value}
      >
        <YouTubeCarousel videos={featuredVideos} type="video" />
      </OsuSection>

      <OsuSection
        className="w-full"
        id="twitter-clips"
        title={content.sections.twitterClips.value}
      >
        <span className="block text-center text-xs">
          {content.sections.twitterNote.value}
        </span>
        <TwitterCarousel tweets={TWEETS} />
      </OsuSection>

      <OsuSection
        className="w-full"
        id="osu-settings"
        title={content.sections.osuSettings.value}
      >
        <SettingsByEra />
      </OsuSection>

      <OsuSection
        className="w-full"
        id="my-links"
        title={content.sections.myLinks.value}
      >
        <LinkList />
      </OsuSection>
    </div>
  )
}
