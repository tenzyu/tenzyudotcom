import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RecommendationsPageData } from './lib/types'
import { YouTubeChannelList } from './youtube-channel-list'
import { YouTubePlaylist } from './youtube-playlist'

type RecommendationsPageContentProps = RecommendationsPageData

export function RecommendationsPageContent({
  channels,
  videos,
}: RecommendationsPageContentProps) {
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
            videos={videos}
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
