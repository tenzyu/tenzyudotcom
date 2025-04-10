'use client'

import { LanguageSwitcher } from '@/components/common/language-switcher'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'

type HeaderProps = {
  locale: string
}
export function Header(props: HeaderProps) {
  const { theme, setTheme } = useTheme()

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
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label='Toggle theme'
          >
            <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
            <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          </Button>
        </nav>
      </div>
    </header>
  )
}
