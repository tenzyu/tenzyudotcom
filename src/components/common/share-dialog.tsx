'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link, Mail, Share2, Twitter } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { shareContent } from '@/lib/utils'

interface ShareDialogProps {
  title: string
  url: string
}

export function ShareDialog({ title, url }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${baseUrl}/u/${url}`

  // handleShare関数を更新
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
      <DialogTrigger asChild={true}>
        {/* あとでこの辺のサイズ直す */}
        <Button variant='ghost' className='h-auto py-4'>
          <Share2 className='size-5' />
          <span className='sr-only'>Share {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
        </DialogHeader>
        <div className='grid grid-cols-4 gap-4 py-4'>
          <Button
            variant='outline'
            className='flex flex-col items-center gap-1 h-auto py-3'
            onClick={() => handleShare('copy')}
          >
            <Link className='h-5 w-5' />
            <span className='text-xs'>Copy</span>
          </Button>

          <Button
            variant='outline'
            className='flex flex-col items-center gap-1 h-auto py-3'
            onClick={() => handleShare('twitter')}
          >
            <Twitter className='h-5 w-5 text-[#1DA1F2]' />
            <span className='text-xs'>Twitter</span>
          </Button>

          <Button
            variant='outline'
            className='flex flex-col items-center gap-1 h-auto py-3'
            onClick={() => handleShare('email')}
          >
            <Mail className='h-5 w-5' />
            <span className='text-xs'>Email</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
