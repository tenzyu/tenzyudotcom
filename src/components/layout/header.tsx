import Link from 'next/link'

import { LanguageSwitcher } from '@/components/features/language-switcher'
import { ThemeSwitcher } from '@/components/features/theme-switcher'

type HeaderProps = {
  locale: string
}
export function Header(props: HeaderProps) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-2">
        <Link
          href="/"
          className="hover:text-primary text-xl font-bold transition-colors"
          prefetch
        >
          tenzyu.com
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/u"
            className="hover:text-primary text-sm font-medium transition-colors"
          >
            LINKS
          </Link>
          <Link
            href="/blog"
            className="hover:text-primary text-sm font-medium transition-colors"
          >
            BLOG
          </Link>
          <LanguageSwitcher currentLocale={props.locale} />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
