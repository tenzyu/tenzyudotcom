import { VisuallyHidden } from 'radix-ui'
import { DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/common'

type YouTubeDialogContentProps = {
  videoId: string
  title: string
  className?: string
  frameClassName?: string
  iframeClassName?: string
  embedParams?: string
}

export function YouTubeDialogContent({
  videoId,
  title,
  className,
  frameClassName,
  iframeClassName,
  embedParams = '&rel=0&modestbranding=1',
}: YouTubeDialogContentProps) {
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
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1${embedParams}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </DialogContent>
  )
}
