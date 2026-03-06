import { getLocale } from 'next-intl/server'

import { PageHeader } from '@/components/site/page-header'
import { YouTubePlaylist } from '@/components/features/social/youtube-playlist'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RECOMMENDATION_VIDEOS } from '@/data/recommendations'
import { fetchYouTubeTitle } from '@/lib/youtube'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recommendations',
  description: 'Music, videos, and other things I like.',
}

export default async function RecommendationsPage() {
  const locale = await getLocale()
  const isJa = locale === 'ja'
  const commentLabel = isJa ? 'ひとことコメント' : 'Quick comment'
  const viewLabel = isJa ? '再生数' : 'Views'
  const videosWithTitles = await Promise.all(
    RECOMMENDATION_VIDEOS.map(async (v) => ({
      id: v.id,
      note: isJa ? v.note.ja : v.note.en,
      views: v.views,
      title: await fetchYouTubeTitle(v.id),
    })),
  )

  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Music, videos, and other things I like."
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
