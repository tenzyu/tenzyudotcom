import Link from 'next/link'

import { LanguageSwitcher } from '@/components/features/language-switcher'
import { ThemeSwitcher } from '@/components/features/theme-switcher'
import { Container } from '@/components/site/container'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

type HeaderProps = {
  locale: string
}

const navLinkStyles = 'hover:text-primary transition-colors'
const NAV_ITEMS = [
  { href: '/blog', label: 'Blog' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/tools', label: 'Tools' },
  { href: '/links', label: 'Links' },
] as const

export function Header(props: HeaderProps) {
  return (
    <header className="bg-background/70 supports-backdrop-filter:bg-background/50 border-border/40 sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className={cn(navLinkStyles, 'text-xl font-bold tracking-tight')}
          prefetch
        >
          tenzyu.com
        </Link>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            {NAV_ITEMS.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  asChild
                  className={cn(
                    navLinkStyles,
                    'text-sm font-semibold tracking-tight',
                  )}
                >
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <nav className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={props.locale} />
          <ThemeSwitcher />
        </nav>
      </Container>
    </header>
  )
}
