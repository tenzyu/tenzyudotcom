'use client'

import { Link, Mail, Share2 } from 'lucide-react'
import { useIntlayer } from 'next-intlayer'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils/common'

type FooterShareDialogProps = {
  title: string
  shareText?: string
  triggerClassName?: string
  triggerLabel?: string
}

type SharePlatform = 'twitter' | 'email' | 'copy'

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="X"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <title>X</title>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  )
}

function ShareButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="soft"
      className="flex h-auto flex-col items-center gap-1 py-3"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  )
}

function getTwitterShareUri(text: string, url: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

function getEmailShareUri(title: string, url: string): string {
  return `mailto:?subject=${title}&body=${url}`
}

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined') {
    void navigator.clipboard.writeText(text)
  }
}

function shareContent(platform: SharePlatform, url: string, title: string) {
  let uri = ''
  let copied = false

  switch (platform) {
    case 'twitter':
      uri = getTwitterShareUri(title, url)
      break
    case 'email':
      uri = getEmailShareUri(title, url)
      break
    case 'copy':
      copyToClipboard(url)
      copied = true
      break
  }

  return { uri, copied }
}

export function FooterShareDialog({
  title,
  shareText,
  triggerClassName,
  triggerLabel,
}: FooterShareDialogProps) {
  const content = useIntlayer('shareDialog')
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const shareMessage = shareText ?? title

  useEffect(() => {
    setShareUrl(window.location.href)
  }, [])

  const handleShare = (platform: SharePlatform) => {
    const result = shareContent(platform, shareUrl, shareMessage)
    if (result.copied) {
      toast.success(content.linkCopied, { description: shareUrl })
      setOpen(false)
    } else if (result.uri) {
      window.open(result.uri, '_blank', 'noopener,noreferrer')
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
