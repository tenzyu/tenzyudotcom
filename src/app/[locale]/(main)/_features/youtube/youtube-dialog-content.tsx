import { VisuallyHidden } from 'radix-ui'
import { DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/common'
import { buildYouTubeEmbedUrl } from '@/features/youtube/youtube.domain'

type YouTubeDialogContentProps = {
  videoId: string
  title: string
  className?: string
  frameClassName?: string
  iframeClassName?: string
}

export function YouTubeDialogContent({
  videoId,
  title,
  className,
  frameClassName,
  iframeClassName,
}: YouTubeDialogContentProps) {
  const embedUrl = buildYouTubeEmbedUrl(videoId, {
    autoplay: true,
  })

  return (
    <DialogContent className={cn('overflow-hidden p-0', className)}>
      <VisuallyHidden.Root>
        <DialogTitle>{title}</DialogTitle>
      </VisuallyHidden.Root>
      <div className={cn('bg-black', frameClassName)}>
        <iframe
          width="100%"
          height="100%"
          className={cn('border-0', iframeClassName)}
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </DialogContent>
  )
}
