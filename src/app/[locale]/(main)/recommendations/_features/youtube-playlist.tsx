import { OtakuAside } from '@/components/site-ui/otaku-aside'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { YouTubeDialogContent } from '@/features/youtube/youtube-dialog-content'
import { YouTubeThumbnailImage } from '@/features/youtube/youtube-thumbnail-image'
import { cn } from '@/lib/utils'
import type { YouTubePlaylistItem } from './lib/types'

type YouTubePlaylistProps = {
  videos: YouTubePlaylistItem[]
  viewLabel?: string
  commentLabel?: string
  className?: string
}

export function YouTubePlaylist({
  videos,
  viewLabel = 'Views',
  commentLabel = 'Quick comment',
  className,
}: YouTubePlaylistProps) {
  return (
    <div
      className={cn(
        'border-border/60 bg-card/40 rounded-2xl border',
        className,
      )}
    >
      <ul className="divide-border/60 divide-y">
        {videos.map((video) => (
          <li key={video.id}>
            <Dialog>
              <div>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="group hover:bg-muted/40 w-full text-left transition-colors"
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
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="space-y-1">
                          <h3 className="text-base leading-snug font-semibold">
                            {video.title}
                          </h3>
                          <p className="text-muted-foreground text-xs font-medium">
                            {viewLabel}: {video.views}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                <div className="px-4 pb-4 sm:px-5">
                  <OtakuAside label={commentLabel}>
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
  )
}
