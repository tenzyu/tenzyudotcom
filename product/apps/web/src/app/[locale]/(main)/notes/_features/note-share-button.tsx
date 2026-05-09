'use client'

import { Share2 } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type NoteShareButtonProps = {
  className?: string
  locale: string
  sharePath: string
  title: string
}

function getMessages(locale: string) {
  if (locale === 'ja') {
    return {
      copied: 'リンクをコピーしました',
      shareLabel: '共有',
      shareError: '共有に失敗しました。',
    }
  }

  return {
    copied: 'Link copied',
    shareLabel: 'Share',
    shareError: 'Failed to share.',
  }
}

export function NoteShareButton({
  className,
  locale,
  sharePath,
  title,
}: NoteShareButtonProps) {
  const messages = getMessages(locale)
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return sharePath
    }

    return new URL(sharePath, window.location.origin).toString()
  }, [sharePath])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={messages.shareLabel}
      onClick={async () => {
        try {
          if (typeof navigator !== 'undefined' && navigator.share) {
            await navigator.share({
              title,
              url: shareUrl,
            })
            return
          }

          await navigator.clipboard.writeText(shareUrl)
          toast.success(messages.copied, {
            description: shareUrl,
          })
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return
          }

          toast.error(messages.shareError)
        }
      }}
    >
      <Share2 className="size-4" />
    </Button>
  )
}
