import Link from 'next/link'

import { LanguageSwitcher } from '@/components/features/language-switcher'
import { ThemeSwitcher } from '@/components/features/theme-switcher'
import { cn } from '@/lib/utils'

type HeaderProps = {
  locale: string
}

const navLinkStyles = 'hover:text-primary transition-colors'

export function Header(props: HeaderProps) {
  return (
    <header className="bg-background/70 supports-[backdrop-filter]:bg-background/50 border-border/40 sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          className={cn(navLinkStyles, 'text-xl font-bold tracking-tight')}
          prefetch
        >
          tenzyu.com
        </Link>

        <nav className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={props.locale} />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
