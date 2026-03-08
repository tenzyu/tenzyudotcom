'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useIntlayer } from 'next-intlayer'
import { startTransition } from 'react'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RecommendationsPageData } from './lib/types'
import { isRecommendationTabId } from './recommendations.contract'
import { RECOMMENDATION_TABS } from './recommendations.data'
import { YouTubeChannelList } from './youtube-channel-list'
import { YouTubePlaylist } from './youtube-playlist'

type RecommendationsPageContentProps = RecommendationsPageData

export function RecommendationsPageContent({
  channels,
  videos,
}: RecommendationsPageContentProps) {
  const content = useIntlayer('page-recommendations')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const activeTab = isRecommendationTabId(requestedTab)
    ? requestedTab
    : 'music'

  function handleTabChange(value: string) {
    if (!isRecommendationTabId(value)) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    if (value === 'music') {
      params.delete('tab')
    } else {
      params.set('tab', value)
    }

    const nextQuery = params.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

    startTransition(() => {
      router.replace(nextUrl, { scroll: false })
    })
  }

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
        className="flex flex-col gap-4"
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="mt-8 flex flex-col gap-6"
      >
        <TabsList className="grid w-full grid-cols-2 md:inline-flex md:w-auto">
          {RECOMMENDATION_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {content.tabs[tab.id]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="music" className="border-none p-0">
          <YouTubePlaylist
            videos={videos}
            viewLabel={content.labels.views.value}
            commentLabel={content.labels.comment.value}
          />
        </TabsContent>

        <TabsContent value="channels" className="border-none p-0">
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
