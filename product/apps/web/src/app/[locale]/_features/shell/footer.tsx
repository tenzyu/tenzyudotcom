import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/app/[locale]/_features/external-link'
import { Container } from './container'
import { FooterShareDialog } from './footer-share-dialog'
import { KoFiLink } from './kofi-link'

const socialLinks = [
  { href: 'https://twitch.tv/tenzyudotcom', label: 'Twitch' },
  { href: 'https://www.youtube.com/@tenzyudotcom', label: 'YouTube' },
  { href: 'https://x.com/FlawInAffection', label: 'X' },
]

export function Footer({ locale }: { locale: string }) {
  const site = useIntlayer('site', locale)
  const footer = useIntlayer('footer', locale)

  return (
    <footer className="mt-16 border-t border-border py-8 sm:py-12">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-serif text-xl">tenzyu.com</p>
          <p className="mt-2 text-xs text-muted-foreground">
            © {new Date().getFullYear()} tenzyu
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {socialLinks.map((link) => (
            <ExternalLink
              key={link.label}
              href={link.href}
              className="inline-flex min-h-11 items-center hover:text-primary hover:underline"
            >
              {link.label}
            </ExternalLink>
          ))}
          <KoFiLink label={footer.supportLabel.value} variant="ghost" />
          <FooterShareDialog
            title="tenzyu.com"
            shareText={site.shareTitle.value}
            triggerLabel={footer.shareLabel.value}
            triggerClassName="text-muted-foreground hover:text-primary py-2"
          />
        </div>
      </Container>
    </footer>
  )
}
