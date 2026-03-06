import { getLocale } from 'next-intl/server'

import { PageHeader } from '@/components/site/page-header'
import { YouTubePlaylist } from '@/components/features/social/youtube-playlist'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FAVORITES_COPY } from '@/data/copies'
import { RECOMMENDATION_VIDEOS } from '@/data/recommendations'
import { fetchYouTubeVideoMeta } from '@/lib/youtube'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: FAVORITES_COPY.pageTitle,
  description: FAVORITES_COPY.pageDescription,
}

export default async function RecommendationsPage() {
  const locale = await getLocale()
  const isJa = locale === 'ja'
  const commentLabel = isJa ? 'ひとことコメント' : 'Quick comment'
  const viewLabel = isJa ? '再生数' : 'Views'
  const viewLocale = isJa ? 'ja-JP' : 'en-US'
  const videosWithTitles = await Promise.all(
    RECOMMENDATION_VIDEOS.map(async (v) => {
      const { title, views } = await fetchYouTubeVideoMeta(v.id, viewLocale)
      return {
        id: v.id,
        note: isJa ? v.note.ja : v.note.en,
        views,
        title,
      }
    }),
  )

  return (
    <>
      <PageHeader
        title={FAVORITES_COPY.pageTitle}
        description={FAVORITES_COPY.pageDescription}
        className="space-y-4"
      />

      <Tabs defaultValue="music" className="mt-8 space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:inline-flex md:w-auto">
          <TabsTrigger value="music">Music</TabsTrigger>
          <TabsTrigger value="videos" disabled>
            Videos (Soon)
          </TabsTrigger>
          <TabsTrigger value="socials" disabled>
            Socials (Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="space-y-4 border-none p-0">
          <YouTubePlaylist
            videos={videosWithTitles}
            viewLabel={viewLabel}
            commentLabel={commentLabel}
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
