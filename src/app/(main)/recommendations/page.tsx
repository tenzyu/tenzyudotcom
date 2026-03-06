import { PageHeader } from '@/components/site/page-header'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { YouTubeCarousel } from '@/components/features/social/youtube-carousel'
import { HOME_VIDEOS } from '@/data/home'
import { fetchYouTubeTitle } from '@/lib/youtube'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recommendations',
  description: 'Music, videos, and other things I like.',
}

export default async function RecommendationsPage() {
  const videosWithTitles = await Promise.all(
    HOME_VIDEOS.map(async (v) => ({
      id: v.id,
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
          <Card className="bg-card/50 overflow-hidden p-6 shadow-sm">
            <YouTubeCarousel videos={videosWithTitles as any} type="video" />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
