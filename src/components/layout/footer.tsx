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
import { shareContent } from '@/lib/utils/share'

export function Footer() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''

  // handleShare関数を更新
  const handleShare = (platform: string) => {
    const encodedTitle = 'tenzyu.com - osu! player'
    const result = shareContent(platform, siteUrl, encodedTitle)
    if (result.copied) {
      toast.success('Link copied to clipboard', { description: siteUrl })
      setShareDialogOpen(false)
    } else if (result.uri) {
      window.open(result.uri, '_blank')
      setShareDialogOpen(false)
    }
  }

  return (
    <footer className="bg-background/80 w-full border-t py-6 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} tenzyu
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://twitch.tv/tenzyudotcom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Twitch
            </a>
            <a
              href="https://www.youtube.com/@tenzyudotcom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              YouTube
            </a>
            <a
              href="https://x.com/tenzyudotcom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Twitter
            </a>

            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Share2 className="mr-1 h-4 w-4" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share tenzyu.com</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 py-4">
                  <Button
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-1 py-3"
                    onClick={() => {
                      handleShare('copy')
                    }}
                  >
                    <Link className="h-5 w-5" />
                    <span className="text-xs">copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-1 py-3"
                    onClick={() => {
                      handleShare('share.twitter')
                    }}
                  >
                    <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                    <span className="text-xs">twitter</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex h-auto flex-col items-center gap-1 py-3"
                    onClick={() => {
                      handleShare('email')
                    }}
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">email</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </footer>
  )
}
