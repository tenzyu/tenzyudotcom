import Image from 'next/image'
import { VisuallyHidden } from 'radix-ui'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type YouTubePlaylistItem = {
  id: string
  title: string
  note: string
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
}

const VideoDialogContent = ({ video }: VideoDialogContentProps) => (
  <DialogContent className="overflow-hidden bg-black p-0 sm:max-w-3xl">
    <VisuallyHidden.Root>
      <DialogTitle>{video.title}</DialogTitle>
    </VisuallyHidden.Root>
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
        'rounded-2xl border border-border/60 bg-card/40',
        className,
      )}
    >
      <ul className="divide-border/60 divide-y">
        {videos.map((video) => (
          <li key={video.id}>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="group w-full text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex w-full flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
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
                        <h3 className="text-base font-semibold leading-snug">
                          {video.title}
                        </h3>
                        <p className="text-muted-foreground text-xs font-medium">
                          {viewLabel}: {video.views}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                          {commentLabel}
                        </p>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {video.note}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              </DialogTrigger>
              <VideoDialogContent video={video} />
            </Dialog>
          </li>
        ))}
      </ul>
    </div>
  )
}
