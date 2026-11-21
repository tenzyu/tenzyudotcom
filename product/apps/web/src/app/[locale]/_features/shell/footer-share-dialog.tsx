'use client'

import { Link, Mail, Share2 } from 'lucide-react'
import { useIntlayer } from 'next-intlayer'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@tenzyu/ui/dialog'
import { cn } from '@tenzyu/ui'

type FooterShareDialogProps = {
  title: string
  shareText?: string
  triggerClassName?: string
  triggerLabel?: string
  itemPath?: string
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
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      variant="outline"
      className="flex h-auto flex-col items-center gap-1 py-3"
      disabled={disabled}
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
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
}

function publicShareUrl(itemPath?: string) {
  const url = new URL(itemPath ?? window.location.href, window.location.origin)
  for (const key of ['edit', 'editor', 'draft', 'archive', 'preview']) {
    url.searchParams.delete(key)
  }
  return url.href
}

export function FooterShareDialog({
  title,
  shareText,
  triggerClassName,
  triggerLabel,
  itemPath,
}: FooterShareDialogProps) {
  const content = useIntlayer('shareDialog')
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [manualUrl, setManualUrl] = useState('')
  const [copying, setCopying] = useState(false)
  const copyFieldId = useId()
  const fallback = useRef<HTMLInputElement>(null)
  const shareMessage = shareText ?? title

  useEffect(() => {
    if (manualUrl) {
      fallback.current?.focus()
      fallback.current?.select()
    }
  }, [manualUrl])

  function changeOpen(next: boolean) {
    setOpen(next)
    if (!next) setManualUrl('')
  }

  async function handleShare(platform: SharePlatform) {
    const url = publicShareUrl(itemPath)
    if (platform === 'copy') {
      setCopying(true)
      try {
        await navigator.clipboard.writeText(url)
        toast.success(content.linkCopied, { description: url })
        changeOpen(false)
      } catch {
        setManualUrl(url)
      } finally {
        setCopying(false)
      }
      return
    }

    const uri =
      platform === 'twitter'
        ? getTwitterShareUri(shareMessage, url)
        : getEmailShareUri(shareMessage, url)
    window.open(uri, '_blank', 'noopener,noreferrer')
    changeOpen(false)
  }

  if (pathname?.match(/^\/(?:en\/|ja\/)?editor(?:\/|$)/)) return null

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
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
        }
      ></DialogTrigger>
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
            disabled={copying}
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
        {manualUrl && (
          <label htmlFor={copyFieldId} className="grid gap-2">
            <span role="alert">{content.manualCopy.value}</span>
            <Input id={copyFieldId} ref={fallback} value={manualUrl} readOnly />
          </label>
        )}
      </DialogContent>
    </Dialog>
  )
}
