import { VisuallyHidden } from 'radix-ui'
import { DialogContent, DialogTitle } from '@tenzyu/ui/dialog'
import { buildTikTokEmbedUrl } from '@/features/tiktok/tiktok.domain'
import { cn } from '@tenzyu/ui'

type TikTokDialogContentProps = {
  embedUrl: string
  title: string
  className?: string
  frameClassName?: string
  iframeClassName?: string
}

export function TikTokDialogContent({
  embedUrl,
  title,
  className,
  frameClassName,
  iframeClassName,
}: TikTokDialogContentProps) {
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
          src={buildTikTokEmbedUrl(embedUrl)}
          title={title}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </DialogContent>
  )
}
