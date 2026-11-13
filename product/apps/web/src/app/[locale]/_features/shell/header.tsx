import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
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
    <header className="border-b border-border">
      <Container className="py-5 sm:py-7">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={getLocalizedUrl('/', locale)}
            className="font-serif text-2xl tracking-tight transition-colors hover:text-primary sm:text-3xl"
          >
            tenzyu<span className="text-primary">.</span>com
          </Link>
          <fieldset
            aria-label={content.utilityNavLabel.value}
            className="flex min-w-0 shrink-0 items-center gap-1 border-0 p-0"
          >
            <LanguageSwitcher />
            <ThemeSwitcher />
          </fieldset>
        </div>
        <nav
          aria-label={content.primaryNavLabel.value}
          className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm sm:gap-x-7"
        >
          {PRIMARY_NAV_ROUTE_IDS.map((routeId) => (
            <Link
              key={routeId}
              href={getLocalizedUrl(PUBLIC_ROUTES[routeId].href, locale)}
              className="inline-flex min-h-11 items-center decoration-primary transition-colors hover:text-primary hover:underline"
            >
              {content.primaryNav[routeId].value}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  )
}
