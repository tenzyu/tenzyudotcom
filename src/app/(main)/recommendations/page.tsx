import { getLocale } from 'next-intl/server'

import { PageHeader } from '@/components/site/page-header'
import { OtakuAside } from '@/components/site/otaku-aside'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { YouTubeCarousel } from '@/components/features/social/youtube-carousel'
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
  const otakuLabel = isJa ? 'オタク特有の早口' : 'Nerdy rapid-fire take'
  const videosWithTitles = await Promise.all(
    RECOMMENDATION_VIDEOS.map(async (v) => ({
      id: v.id,
      note: isJa ? v.note.ja : v.note.en,
      title: await fetchYouTubeTitle(v.id),
    })),
  )
  const carouselVideos = videosWithTitles.map((video) => ({
    id: video.id,
    title: video.title,
    type: 'video' as const,
  }))

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
          <Card variant="soft" className="overflow-hidden p-6">
            <YouTubeCarousel videos={carouselVideos} type="video" />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {videosWithTitles.map((video) => (
              <Card key={video.id} variant="soft">
                <CardHeader className="gap-1">
                  <CardTitle className="text-base">
                    {video.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isJa ? '天珠の短評' : 'Tenzyu note'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <OtakuAside label={otakuLabel}>{video.note}</OtakuAside>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
