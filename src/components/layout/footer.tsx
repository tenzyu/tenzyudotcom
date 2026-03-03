'use client'

import { Link, Mail, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ShareButton } from '@/components/common/share-button'
import { XIcon } from '@/components/common/social-icons'
import { Button } from '@/components/shadcn-ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/shadcn-ui/dialog'
import { shareContent } from '@/lib/utils/share'

const socialLinks = [
  {
    href: 'https://twitch.tv/tenzyudotcom',
    label: 'Twitch',
  },
  {
    href: 'https://www.youtube.com/@tenzyudotcom',
    label: 'YouTube',
  },
  {
    href: 'https://x.com/FlawInAffection',
    label: 'X',
  },
]

export function Footer() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')

  useEffect(() => {
    setSiteUrl(window.location.origin)
  }, [])

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
            {socialLinks.map((link) => (
              <Button key={link.label} variant="ghost" asChild>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </Button>
            ))}

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
                  <ShareButton
                    icon={<Link className="h-5 w-5" />}
                    label="copy"
                    onClick={() => {
                      handleShare('copy')
                    }}
                  />
                  <ShareButton
                    icon={<XIcon className="h-5 w-5 text-[#1DA1F2]" />}
                    label="X"
                    onClick={() => {
                      handleShare('twitter')
                    }}
                  />
                  <ShareButton
                    icon={<Mail className="h-5 w-5" />}
                    label="email"
                    onClick={() => {
                      handleShare('email')
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </footer>
  )
}
