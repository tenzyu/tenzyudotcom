'use client'

import { Button } from '@/components/shadcn-ui/button'

import { ShareDialog } from '../features/share-dialog'

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

            <ShareDialog
              title="TENZYU's secret hideout"
              triggerLabel="Share"
              triggerClassName="text-muted-foreground hover:text-primary py-2"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
