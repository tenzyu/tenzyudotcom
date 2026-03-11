import { useIntlayer, useLocale } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { TabsContent } from '@/components/ui/tabs'
import type { RecommendationsPageData } from './lib/types'
import { RecommendationTabs } from './recommendation-tabs'
import { RECOMMENDATION_TABS } from './recommendations.assemble'
import { YouTubeChannelList } from './youtube-channel-list'
import { YouTubePlaylist } from './youtube-playlist'
import { AdminGate } from '@/features/admin/admin-gate'
import { RecommendationsEditorDeferred } from '@/app/[locale]/(admin)/editor/_features/recommendations-editor-deferred'
import { Content } from '@/components/site-ui/content'

type RecommendationsPageContentProps = RecommendationsPageData

export async function RecommendationsPageContent({
  channels,
  videos,
}: RecommendationsPageContentProps) {
  const content = useIntlayer('page-recommendations')
  const { locale } = useLocale()

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
        className="flex flex-col gap-4"
      />

      <AdminGate>
        <Content size="4xl" className="mb-12">
          <div className="rounded-lg border-2 border-dashed p-4">
            <p className="mb-4 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Admin View: Recommendations
            </p>
            <RecommendationsEditorDeferred locale={locale || 'ja'} />
          </div>
          <hr className="mt-12" />
        </Content>
      </AdminGate>

      <RecommendationTabs
        className="mt-8 flex flex-col gap-6"
        tabs={RECOMMENDATION_TABS.map((tab) => ({
          id: tab.id,
          label: content.tabs[tab.id].value,
        }))}
      >
        <TabsContent value="music" className="border-none p-0">
          <YouTubePlaylist
            videos={videos}
            openLabel={content.labels.openVideo.value}
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
      </RecommendationTabs>
    </>
  )
}
