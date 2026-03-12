import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import {
  PRIMARY_NAV_ROUTE_IDS,
  PUBLIC_ROUTES,
} from '@/features/site-navigation/public-routes.data'
import { cn } from '@/lib/utils/common'
import { Container } from './container'
import { LanguageSwitcher } from './language-switcher'
import { ThemeSwitcher } from './theme-switcher'

const navLinkStyles = 'hover:text-primary transition-colors'

export function Header({ locale }: { locale: string }) {
  const content = useIntlayer('shell', locale)

  return (
    <header className="bg-background/70 supports-backdrop-filter:bg-background/50 border-border/40 sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href={getLocalizedUrl('/', locale)}
            className={cn(navLinkStyles, 'text-xl font-bold tracking-tight')}
            prefetch
          >
            tenzyu.com
          </Link>

          <nav
            aria-label={content.primaryNavLabel.value}
            className="hidden items-center gap-4 md:flex"
          >
            {PRIMARY_NAV_ROUTE_IDS.map((routeId) => (
              <Link
                key={routeId}
                href={getLocalizedUrl(PUBLIC_ROUTES[routeId].href, locale)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {content.primaryNav[routeId].value}
              </Link>
            ))}
          </nav>
        </div>

        <nav
          aria-label={content.utilityNavLabel.value}
          className="flex items-center gap-2"
        >
          <LanguageSwitcher />
          <ThemeSwitcher />
        </nav>
      </Container>
    </header>
  )
}
