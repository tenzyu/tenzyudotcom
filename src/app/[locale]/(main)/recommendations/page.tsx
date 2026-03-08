import { getIntlayer } from 'intlayer'
import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import {
  RECOMMENDATION_CHANNELS,
  RECOMMENDATION_VIDEOS,
  type RecommendationChannelId,
  type RecommendationVideoId,
} from './_data/recommendations'
import {
  type YouTubeChannelItem,
  YouTubeChannelList,
} from './_features/youtube-channel-list'
import {
  YouTubePlaylist,
  type YouTubePlaylistItem,
} from './_features/youtube-playlist'
import { fetchYouTubeVideoMeta } from './_lib/youtube'

export const dynamic = 'force-static'
export const generateMetadata = createPageMetadata('page-recommendations', {
  pathname: '/recommendations',
})

const RecommendationsPageContent = ({
  videosWithTitles,
  channels,
}: {
  videosWithTitles: YouTubePlaylistItem[]
  channels: YouTubeChannelItem[]
}) => {
  const content = useIntlayer('page-recommendations')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
        className="flex flex-col gap-4"
      />

      <Tabs defaultValue="music" className="mt-8 flex flex-col gap-6">
        <TabsList className="grid w-full grid-cols-3 md:inline-flex md:w-auto">
          <TabsTrigger value="music">{content.tabs.music}</TabsTrigger>
          <TabsTrigger value="socials">{content.tabs.socials}</TabsTrigger>
          <TabsTrigger value="videos" disabled>
            {content.tabs.videos}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="border-none p-0">
          <YouTubePlaylist
            videos={videosWithTitles}
            viewLabel={content.labels.views.value}
            commentLabel={content.labels.comment.value}
          />
        </TabsContent>

        <TabsContent value="socials" className="border-none p-0">
          <SectionHeader
            title={content.sections.youtubeChannels.title.value}
            description={content.sections.youtubeChannels.description.value}
            titleClassName="text-xl"
            className="space-y-1 pb-4"
          />
          <YouTubeChannelList
            channels={channels}
            commentLabel={content.labels.comment.value}
            openLabel={content.labels.openChannel.value}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}

const RecommendationsPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)
  const content = getIntlayer('page-recommendations', locale)
  const viewLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const [videosWithTitles, channels] = await Promise.all([
    Promise.all(
      RECOMMENDATION_VIDEOS.map(async (video) => {
        const { title, views } = await fetchYouTubeVideoMeta(
          video.id,
          viewLocale,
        )

        return {
          id: video.id,
          note: content.videoNotes[video.id as RecommendationVideoId],
          views,
          title,
        }
      }),
    ) as Promise<YouTubePlaylistItem[]>,
    Promise.resolve(
      RECOMMENDATION_CHANNELS.map((channel) => ({
        title: channel.title,
        handle: channel.handle,
        url: channel.url,
        note: content.channelNotes[channel.id as RecommendationChannelId],
      })),
    ) as Promise<YouTubeChannelItem[]>,
  ])

  return (
    <IntlayerServerProvider locale={locale}>
      <RecommendationsPageContent
        videosWithTitles={videosWithTitles}
        channels={channels}
      />
    </IntlayerServerProvider>
  )
}

export default RecommendationsPage
