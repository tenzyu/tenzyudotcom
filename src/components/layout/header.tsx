import Link from 'next/link'

import { LanguageSwitcher } from '@/components/features/language-switcher'
import { ThemeSwitcher } from '@/components/features/theme-switcher'
import { Button } from '@/components/shadcn-ui/button'
import { cn } from '@/lib/utils'

type HeaderProps = {
  locale: string
}

const navLinkStyles = 'hover:text-primary transition-colors'

export function Header(props: HeaderProps) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-2">
        <Link
          href="/"
          className={cn(navLinkStyles, 'text-xl font-bold')}
          prefetch
        >
          tenzyu.com
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link
              href="/u"
              className={cn(navLinkStyles, 'text-sm font-medium')}
            >
              LINKS
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link
              href="/blog"
              className={cn(navLinkStyles, 'text-sm font-medium')}
            >
              BLOG
            </Link>
          </Button>
          <LanguageSwitcher currentLocale={props.locale} />
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  )
}
