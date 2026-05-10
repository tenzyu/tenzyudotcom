import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/app/[locale]/_features/external-link'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Container } from './container'
import { FooterShareDialog } from './footer-share-dialog'
import { KoFiLink } from './kofi-link'

const socialLinks = [
  { href: 'https://twitch.tv/tenzyudotcom', label: 'Twitch', id: '@tenzyudotcom' },
  { href: 'https://www.youtube.com/@tenzyudotcom', label: 'YouTube', id: '@tenzyudotcom' },
  { href: 'https://x.com/FlawInAffection', label: 'X', id: '@FlawInAffection' },
]

export function Footer({ locale }: { locale: string }) {
  const site = useIntlayer('site', locale)
  const footer = useIntlayer('footer', locale)
  const shareTitle = site.shareTitle

  return (
    <footer className="mt-16 w-full border-t border-border/50 bg-background/60 py-10 backdrop-blur-xl">
      <Container>
        <div className="rounded-[var(--radius-2xl)] border border-border/60 bg-card/45 p-5 shadow-[var(--shadow-surface)] sm:p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold tracking-[-0.02em]">tenzyu.com</p>
              <p className="text-muted-foreground text-xs">
                © {new Date().getFullYear()} tenzyu
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((link) =>
                link.id ? (
                  <Tooltip key={link.label}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" asChild>
                        <ExternalLink href={link.href}>{link.label}</ExternalLink>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent sideOffset={6}>{link.id}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button key={link.label} variant="ghost" size="sm" asChild>
                    <ExternalLink href={link.href}>{link.label}</ExternalLink>
                  </Button>
                ),
              )}

              <KoFiLink label={footer.supportLabel.value} />

              <FooterShareDialog
                title="tenzyu.com"
                shareText={shareTitle.value}
                triggerLabel={footer.shareLabel.value}
                triggerClassName="text-muted-foreground hover:text-primary py-2"
              />
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
