'use client'

import { ChevronDown, Globe } from 'lucide-react'
import { getLocaleName, getLocalizedUrl } from 'intlayer'
import { useLocale } from 'next-intlayer'
import { useIntlayer } from 'next-intlayer'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const content = useIntlayer('languageSwitcher')
  const { locale, availableLocales, setLocale, pathWithoutLocale } =
    useLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="soft"
          className="gap-2 px-3"
          aria-label={content.changeLanguage.value}
        >
          <Globe className="text-muted-foreground h-[1.2rem] w-[1.2rem]" />
          {getLocaleName(locale)}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((localeItem) => (
          <DropdownMenuItem
            key={localeItem}
            asChild
            className={localeItem === locale ? 'bg-muted' : ''}
          >
            <Link
              href={getLocalizedUrl(pathWithoutLocale || '/', localeItem)}
              onClick={() => setLocale(localeItem)}
              aria-current={localeItem === locale ? 'page' : undefined}
              replace
            >
              {getLocaleName(localeItem)}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
