import { LanguageSwitcher } from '@/components/features/language-switcher'
import { ThemeSwitcher } from '@/components/features/theme-switcher'
import Link from 'next/link'

type HeaderProps = {
  locale: string
}
export function Header(props: HeaderProps) {
  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between mx-auto px-2'>
        <Link
          href='/'
          className='font-bold text-xl hover:text-primary transition-colors'
        >
          tenzyu.com
        </Link>

        <nav className='flex items-center gap-6'>
          <Link
            href='/u'
            className='text-sm font-medium hover:text-primary transition-colors'
          >
            LINKS
          </Link>
          <Link
            href='/blog'
            className='text-sm font-medium hover:text-primary transition-colors'
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
