import { useIntlayer } from 'next-intlayer/server'
import { Container } from '@/components/site/container'
import { ExternalLink } from '@/components/site/external-link'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { ShareDialog } from '../features/share-dialog'

const socialLinks = [
  {
    href: 'https://twitch.tv/tenzyudotcom',
    label: 'Twitch',
    id: '@tenzyudotcom',
  },
  {
    href: 'https://www.youtube.com/@tenzyudotcom',
    label: 'YouTube',
    id: '@tenzyudotcom',
  },
  {
    href: 'https://x.com/FlawInAffection',
    label: 'X',
    id: '@FlawInAffection',
  },
]

export function Footer({ locale }: { locale: string }) {
  const site = useIntlayer('site', locale)
  const footer = useIntlayer('footer', locale)
  const shareTitle = site.shareTitle

  return (
    <footer className="border-border/40 bg-background/50 w-full border-t py-12 backdrop-blur-md">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} tenzyu
          </div>

          <div className="flex items-center gap-4">
            <TooltipProvider>
              {socialLinks.map((link) =>
                link.id ? (
                  <Tooltip key={link.label}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" asChild>
                        <ExternalLink
                          href={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </ExternalLink>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{link.id}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button key={link.label} variant="ghost" asChild>
                    <ExternalLink
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </ExternalLink>
                  </Button>
                ),
              )}
            </TooltipProvider>

            <ShareDialog
              title="tenzyu.com"
              shareText={shareTitle.value}
              triggerLabel={footer.shareLabel.value}
              triggerClassName="text-muted-foreground hover:text-primary py-2"
            />
          </div>
        </div>
      </Container>
    </footer>
  )
}
