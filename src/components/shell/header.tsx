import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { LanguageSwitcher } from '@/features/site-controls/language-switcher'
import { ThemeSwitcher } from '@/features/site-controls/theme-switcher'
import { cn } from '@/lib/utils/common'
import { Container } from './container'

const navLinkStyles = 'hover:text-primary transition-colors'

export function Header() {
  const { locale } = useLocale()
  const content = useIntlayer('shell')

  return (
    <header className="bg-background/70 supports-backdrop-filter:bg-background/50 border-border/40 sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href={getLocalizedUrl('/', locale)}
          className={cn(navLinkStyles, 'text-xl font-bold tracking-tight')}
          prefetch
        >
          tenzyu.com
        </Link>

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
