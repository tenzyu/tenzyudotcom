import Image from 'next/image'
import type { ReactNode } from 'react'
import { VisuallyHidden } from 'radix-ui'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { OtakuAside } from '@/components/site/otaku-aside'

export type YouTubePlaylistItem = {
  id: string
  title: string
  note: ReactNode
  views: string
}

type YouTubePlaylistProps = {
  videos: YouTubePlaylistItem[]
  viewLabel?: string
  commentLabel?: string
  className?: string
}

type VideoDialogContentProps = {
  video: YouTubePlaylistItem
  commentLabel: string
}

const VideoDialogContent = ({ video }: VideoDialogContentProps) => (
  <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
    <VisuallyHidden.Root>
      <DialogTitle>{video.title}</DialogTitle>
    </VisuallyHidden.Root>
    <div className="bg-black">
      <div className="aspect-video w-full">
        <iframe
          width="100%"
          height="100%"
          className="border-0"
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  </DialogContent>
)

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
                        <Image
                          src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                          alt={video.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 240px"
                          loading="lazy"
                          quality={75}
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
              <VideoDialogContent video={video} commentLabel={commentLabel} />
            </Dialog>
          </li>
        ))}
      </ul>
    </div>
  )
}
