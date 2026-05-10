import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Badge } from '@tenzyu/ui/badge'
import { Button } from '@tenzyu/ui/button'
import {
  PRIMARY_NAV_ROUTE_IDS,
  PUBLIC_ROUTES,
} from '@/features/site-navigation/public-routes.data'
import { Container } from './container'
import { LanguageSwitcher } from './language-switcher'
import { ThemeSwitcher } from './theme-switcher'

export function Header({ locale }: { locale: string }) {
  const content = useIntlayer('shell', locale)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/72 shadow-[0_1px_0_rgb(255_255_255/0.03)] backdrop-blur-2xl">
      <Container className="flex min-h-16 flex-col justify-center gap-3 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href={getLocalizedUrl('/', locale)}
              className="group inline-flex min-w-0 items-center gap-2 text-base font-bold tracking-[-0.03em] transition-colors hover:text-primary"
              prefetch
            >
              <span className="size-2.5 rounded-full bg-primary shadow-[var(--shadow-accent)]" />
              <span>tenzyu.com</span>
              <Badge variant="outline" className="hidden border-primary/25 bg-primary/8 text-[10px] uppercase tracking-[0.18em] text-primary sm:inline-flex">
                lab
              </Badge>
            </Link>

            <nav
              aria-label={content.primaryNavLabel.value}
              className="hidden items-center gap-1 md:flex"
            >
              {PRIMARY_NAV_ROUTE_IDS.map((routeId) => (
                <Button key={routeId} asChild variant="ghost" size="sm">
                  <Link href={getLocalizedUrl(PUBLIC_ROUTES[routeId].href, locale)}>
                    {content.primaryNav[routeId].value}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>

          <nav
            aria-label={content.utilityNavLabel.value}
            className="flex shrink-0 items-center gap-2"
          >
            <LanguageSwitcher />
            <ThemeSwitcher />
          </nav>
        </div>

        <nav
          aria-label={content.primaryNavLabel.value}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden"
        >
          {PRIMARY_NAV_ROUTE_IDS.map((routeId) => (
            <Button key={routeId} asChild variant="soft" size="xs" className="shrink-0">
              <Link href={getLocalizedUrl(PUBLIC_ROUTES[routeId].href, locale)}>
                {content.primaryNav[routeId].value}
              </Link>
            </Button>
          ))}
        </nav>
      </Container>
    </header>
  )
}
