import { getIntlayer } from 'intlayer'
import type { Metadata } from 'next'
import type { LocalPromiseParams, NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import {
  YouTubePlaylist,
  type YouTubePlaylistItem,
} from '@/components/features/social/youtube-playlist'
import { PageHeader } from '@/components/site/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchYouTubeVideoMeta } from '@/lib/youtube'

export const dynamic = 'force-static'
export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('recommendationsPage', locale)

  return {
    title: content.metadata.title,
    description: content.metadata.description,
  }
}

const RecommendationsPage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = useIntlayer('recommendationsPage', locale)
  const viewLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const videosWithTitles = await Promise.all<YouTubePlaylistItem>(
    content.videos.map(async (video) => {
      const { title, views } = await fetchYouTubeVideoMeta(
        video.id.value,
        viewLocale,
      )

      return {
        id: video.id.value,
        note: video.note.value,
        views,
        title,
      }
    }),
  )

  return (
    <IntlayerServerProvider locale={locale}>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
        className="space-y-4"
      />

      <Tabs defaultValue="music" className="mt-8 space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:inline-flex md:w-auto">
          <TabsTrigger value="music">{content.tabs.music}</TabsTrigger>
          <TabsTrigger value="videos" disabled>
            {content.tabs.videos}
          </TabsTrigger>
          <TabsTrigger value="socials" disabled>
            {content.tabs.socials}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="space-y-4 border-none p-0">
          <YouTubePlaylist
            videos={videosWithTitles}
            viewLabel={content.labels.views.value}
            commentLabel={content.labels.comment.value}
          />
        </TabsContent>
      </Tabs>
    </IntlayerServerProvider>
  )
}

export default RecommendationsPage
