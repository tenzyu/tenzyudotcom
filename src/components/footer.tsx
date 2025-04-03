"use client"

import { Button } from "@/components/ui/button"
import { Twitter, Mail, Link, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

export function Footer() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const siteUrl = typeof window !== "undefined" ? window.location.origin : ""

  const handleShare = (platform: string) => {
    let shareLink = ""
    const encodedUrl = encodeURIComponent(siteUrl)
    const encodedTitle = encodeURIComponent("tenzyu.com - osu! player")

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case "email":
        shareLink = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
        break
      case "copy":
        navigator.clipboard.writeText(siteUrl)
        toast.success("Link copied to clipboard", { description: siteUrl })
        setShareDialogOpen(false)
        return
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
      setShareDialogOpen(false)
    }
  }

  return (
    <footer className="w-full py-6 border-t bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} tenzyu.com. All rights reserved.
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
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <Share2 className="h-4 w-4 mr-2" />
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
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => handleShare("copy")}
                  >
                    <Link className="h-5 w-5" />
                    <span className="text-xs">Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => handleShare("twitter")}
                  >
                    <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                    <span className="text-xs">Twitter</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => handleShare("email")}
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">Email</span>
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

