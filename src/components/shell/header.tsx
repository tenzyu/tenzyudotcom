import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { LanguageSwitcher } from '@/features/site-controls/language-switcher'
import { ThemeSwitcher } from '@/features/site-controls/theme-switcher'
import { cn } from '@/lib/utils/common'
import { Container } from './container'

const navLinkStyles = 'hover:text-primary transition-colors'
const PRIMARY_NAV_ITEMS = [
  { id: 'blog', href: '/blog' },
  { id: 'tools', href: '/tools' },
  { id: 'recommendations', href: '/recommendations' },
  { id: 'portfolio', href: '/portfolio' },
] as const

export function Header() {
  const { locale } = useLocale()
  const content = useIntlayer('shell')

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
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={getLocalizedUrl(item.href, locale)}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {content.primaryNav[item.id].value}
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
