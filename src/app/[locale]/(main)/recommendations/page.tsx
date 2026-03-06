import {
  IntlayerServerProvider,
  getLocale,
  useIntlayer,
} from 'next-intlayer/server'

import { PageHeader } from '@/components/site/page-header'
import { YouTubePlaylist } from '@/components/features/social/youtube-playlist'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fetchYouTubeVideoMeta } from '@/lib/youtube'

export async function generateMetadata() {
  const locale = await getLocale()
  const content = useIntlayer('recommendationsPage', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

export default async function RecommendationsPage() {
  const locale = await getLocale()
  const content = useIntlayer('recommendationsPage', locale)
  const viewLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const videosWithTitles = await Promise.all(
    content.videos.map(async (video) => {
      const { title, views } = await fetchYouTubeVideoMeta(
        video.id.value,
        viewLocale,
      )
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
            // TODO: any やめる
            videos={videosWithTitles.values() as any}
            viewLabel={content.labels.views.value}
            commentLabel={content.labels.comment.value}
          />
        </TabsContent>
      </Tabs>
    </IntlayerServerProvider>
  )
}
