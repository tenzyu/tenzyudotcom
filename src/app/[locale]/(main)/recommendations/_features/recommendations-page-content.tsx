import { useIntlayer, useLocale } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import { TabsContent } from '@/components/ui/tabs'
import { AdminGate } from '@/features/admin/admin-gate'
import { ExternalLink } from '@/components/site-ui/external-link'
import { OtakuAside } from '@/components/site-ui/otaku-aside'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { YouTubeDialogContent } from '@/features/youtube/youtube-dialog-content'
import { YouTubeThumbnailImage } from '@/features/youtube/youtube-thumbnail-image'
import type { RecommendationsPageData } from './lib/types'
import { RecommendationTabs } from './recommendation-tabs'
import { RECOMMENDATION_TABS } from './recommendations.assemble'
import { RecommendationAddButtons } from './recommendation-add-buttons'
import { RecommendationVideoAdminMenu } from './recommendation-video-admin-menu'
import { RecommendationChannelAdminMenu } from './recommendation-channel-admin-menu'
import { ArrowUpRight, Youtube } from 'lucide-react'

type RecommendationsPageContentProps = RecommendationsPageData

export async function RecommendationsPageContent({
  channels,
  videos,
}: RecommendationsPageContentProps) {
  const content = useIntlayer('page-recommendations')
  const { locale } = useLocale()
  const resolvedLocale = locale || 'ja'

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
        className="flex flex-col gap-4"
      />

      <AdminGate>
        <div className="mb-6">
          <RecommendationAddButtons />
        </div>
      </AdminGate>

      <RecommendationTabs
        className="mt-8 flex flex-col gap-6"
        tabs={RECOMMENDATION_TABS.map((tab) => ({
          id: tab.id,
          label: content.tabs[tab.id].value,
        }))}
      >
        <TabsContent value="music" className="border-none p-0">
          <div className="border-border/60 bg-card/40 rounded-2xl border">
            <ul className="divide-border/60 divide-y">
              {videos.map((video) => (
                <li key={video.id} className="relative">
                  <AdminGate>
                    <div className="absolute top-4 right-4 z-10">
                      <RecommendationVideoAdminMenu
                        locale={resolvedLocale}
                        videoId={video.id}
                        label={video.title}
                      />
                    </div>
                  </AdminGate>
                  <Dialog>
                    <div>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="group hover:bg-muted/40 w-full text-left transition-colors"
                          aria-label={`${content.labels.openVideo.value}: ${video.title}`}
                        >
                          <div className="flex w-full flex-col gap-3 px-4 pt-4 pb-2 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg sm:w-48">
                              <YouTubeThumbnailImage
                                videoId={video.id}
                                title={video.title}
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, 240px"
                              />
                            </div>
                            <div className="flex flex-1 flex-col gap-2 pr-12">
                              <div className="space-y-1">
                                <h3 className="text-base leading-snug font-semibold">
                                  {video.title}
                                </h3>
                                <p className="text-muted-foreground text-xs font-medium">
                                  {content.labels.views.value}: {video.views}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      </DialogTrigger>
                      <div className="px-4 pb-4 sm:px-5">
                        <OtakuAside label={content.labels.comment.value}>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {video.note}
                          </p>
                        </OtakuAside>
                      </div>
                    </div>
                    <YouTubeDialogContent
                      videoId={video.id}
                      title={video.title}
                      className="sm:max-w-3xl"
                      frameClassName="aspect-video w-full"
                      iframeClassName="h-full w-full"
                    />
                  </Dialog>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="channels" className="border-none p-0">
          <SectionHeader
            title={content.sections.youtubeChannels.title.value}
            description={content.sections.youtubeChannels.description.value}
            titleClassName="text-xl"
            className="space-y-1 pb-4"
          />
          <div className="border-border/60 bg-card/40 rounded-2xl border">
            <ul className="divide-border/60 divide-y">
              {channels.map((channel) => (
                <li
                  key={channel.url}
                  className="relative flex flex-col gap-4 px-4 py-5 sm:px-5"
                >
                  <AdminGate>
                    <div className="absolute top-4 right-4 z-10">
                      <RecommendationChannelAdminMenu
                        locale={resolvedLocale}
                        url={channel.url}
                        label={channel.title}
                      />
                    </div>
                  </AdminGate>
                  <div className="flex flex-col gap-2 pr-12">
                    <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
                      <Youtube className="size-3.5 text-red-500" />
                      <span>YouTube Channel</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg leading-snug font-semibold">
                        {channel.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {channel.handle}
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <ExternalLink
                      href={channel.url}
                      aria-label={content.labels.openChannel.value}
                      className="justify-center"
                    >
                      <span>{content.labels.openChannel.value}</span>
                      <ArrowUpRight data-icon="inline-end" />
                    </ExternalLink>
                  </Button>

                  <OtakuAside label={content.labels.comment.value}>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {channel.note}
                    </p>
                  </OtakuAside>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>
      </RecommendationTabs>
    </>
  )
}
