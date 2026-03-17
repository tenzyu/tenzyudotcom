'use client'

import { getLocaleName } from 'intlayer'
import { ChevronDown, Globe } from 'lucide-react'
import { useIntlayer, useLocale } from 'next-intlayer'
import { startTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const content = useIntlayer('languageSwitcher')
  const { locale, availableLocales, setLocale } = useLocale({
    onChange: 'replace',
  })

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
            disabled={localeItem === locale}
            className={localeItem === locale ? 'bg-muted' : ''}
            aria-current={localeItem === locale ? 'page' : undefined}
            onSelect={(event) => {
              event.preventDefault()

              if (localeItem === locale) {
                return
              }

              startTransition(() => {
                setLocale(localeItem)
              })
            }}
          >
            {getLocaleName(localeItem)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
