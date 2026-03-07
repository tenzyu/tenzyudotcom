import { getIntlayer } from 'intlayer'
import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import {
  YouTubePlaylist,
  type YouTubePlaylistItem,
} from '@/components/features/social/youtube-playlist'
import { PageHeader } from '@/components/site/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { fetchYouTubeVideoMeta } from '@/lib/youtube'

export const dynamic = 'force-static'
export const generateMetadata = createPageMetadata('page-recommendations', {
  pathname: '/recommendations',
})

const RecommendationsPageContent = ({
  videosWithTitles,
}: {
  videosWithTitles: YouTubePlaylistItem[]
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
          <TabsTrigger value="videos" disabled>
            {content.tabs.videos}
          </TabsTrigger>
          <TabsTrigger value="socials" disabled>
            {content.tabs.socials}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="border-none p-0">
          <YouTubePlaylist
            videos={videosWithTitles}
            viewLabel={content.labels.views.value}
            commentLabel={content.labels.comment.value}
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
  const videosWithTitles: YouTubePlaylistItem[] = await Promise.all(
    content.videos.map(async (video) => {
      const { title, views } = await fetchYouTubeVideoMeta(video.id, viewLocale)

      return {
        id: video.id,
        note: video.note,
        views,
        title,
      }
    }),
  )

  return (
    <IntlayerServerProvider locale={locale}>
      <RecommendationsPageContent videosWithTitles={videosWithTitles} />
    </IntlayerServerProvider>
  )
}

export default RecommendationsPage
