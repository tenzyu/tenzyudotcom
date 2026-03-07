'use client'

import { Link, Mail, Share2 } from 'lucide-react'
import { useIntlayer } from 'next-intlayer'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ShareButton } from '@/components/site/share-button'
import { XIcon } from '@/components/site/social-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { shareContent } from '@/lib/utils/share'

type ShareDialogProps = {
  title: string
  shareText?: string
  triggerClassName?: string
  triggerLabel?: string
}

export function ShareDialog({
  title,
  shareText,
  triggerClassName,
  triggerLabel,
}: ShareDialogProps) {
  const content = useIntlayer('shareDialog')
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const shareMessage = shareText ?? title

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  const handleShare = (platform: string) => {
    const result = shareContent(platform, shareUrl, shareMessage)
    if (result.copied) {
      toast.success(content.linkCopied, { description: shareUrl })
      setOpen(false)
    } else if (result.uri) {
      window.open(result.uri, '_blank')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={triggerLabel ? 'sm' : 'default'}
          className={cn('h-auto py-4', triggerClassName)}
        >
          <Share2 className="size-5" />
          {triggerLabel ? (
            <span className="ml-1">{triggerLabel}</span>
          ) : (
            <span className="sr-only">
              {content.triggerAriaPrefix} {title}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {content.titlePrefix}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <ShareButton
            icon={<Link className="h-5 w-5" />}
            label={content.copy.value}
            onClick={() => {
              handleShare('copy')
            }}
          />
          <ShareButton
            icon={<XIcon className="h-5 w-5" />}
            label="X"
            onClick={() => {
              handleShare('twitter')
            }}
          />
          <ShareButton
            icon={<Mail className="h-5 w-5" />}
            label={content.email.value}
            onClick={() => {
              handleShare('email')
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
