"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Twitter, Mail, Link, Share2 } from "lucide-react"
import { toast } from "sonner"

interface ShareDialogProps {
  title: string
  shortenUrl: string
}

export function ShareDialog({ title, shortenUrl }: ShareDialogProps) {
  const [open, setOpen] = useState(false)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = `${baseUrl}/u/${shortenUrl}`

  const handleShare = (platform: string) => {
    let shareLink = ""
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)

    switch (platform) {
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case "email":
        shareLink = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
        break
      case "copy":
        navigator.clipboard.writeText(shareUrl)
        toast.success("Link copied to clipboard", { description: shareUrl })
        setOpen(false)
        return
    }

    if (shareLink) {
      window.open(shareLink, "_blank")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Share {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4 py-4">
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
  )
}

