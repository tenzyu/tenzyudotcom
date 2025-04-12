'use client'

import { Link, Mail, Share2, Twitter } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/shadcn-ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn-ui/dialog'
import { cn } from '@/lib/utils'
import { shareContent } from '@/lib/utils/share'

type ShareButtonProps = {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function ShareButton({ icon, label, onClick }: ShareButtonProps) {
  return (
    <Button
      variant="outline"
      className="flex h-auto flex-col items-center gap-1 py-3"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  )
}

type ShareDialogProps = {
  title: string
  url: string
  triggerClassName?: string
}

export function ShareDialog({
  title,
  url,
  triggerClassName,
}: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/u/${url}`

  const handleShare = (platform: string) => {
    const result = shareContent(platform, shareUrl, title)
    if (result.copied) {
      toast.success('Link copied to clipboard', { description: shareUrl })
      setOpen(false)
    } else if (result.uri) {
      window.open(result.uri, '_blank')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className={cn('h-auto py-4', triggerClassName)}>
          <Share2 className="size-5" />
          <span className="sr-only">Share {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          <ShareButton
            icon={<Link className="h-5 w-5" />}
            label="Copy"
            onClick={() => { handleShare('copy'); }}
          />
          <ShareButton
            icon={<Twitter className="h-5 w-5 text-[#1DA1F2]" />}
            label="Twitter"
            onClick={() => { handleShare('twitter'); }}
          />
          <ShareButton
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            onClick={() => { handleShare('email'); }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
