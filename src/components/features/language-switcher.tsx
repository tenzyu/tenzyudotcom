'use client'

import { ChevronDown, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { Button } from '@/components/shadcn-ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/shadcn-ui/dropdown-menu'

const LANGUAGES = [
  { label: '日本語', value: 'ja', short: 'JA' },
  { label: 'English', value: 'en', short: 'EN' },
]

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const handleChange = (locale: string) => {
    // Cookie を JS でセット（Secure/HttpOnly は無理だけど今回は不要）
    document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`

    // revalidation
    startTransition(() => {
      router.refresh()
    })
  }

  const currentLang = LANGUAGES.find((lang) => lang.value === currentLocale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 px-3"
          aria-label="Change language"
        >
          <Globe className="text-muted-foreground h-[1.2rem] w-[1.2rem]" />
          <span className="hidden font-medium sm:inline-block">
            {currentLang?.label ?? 'Language'}
          </span>
          <span className="inline-block font-medium sm:hidden">
            {currentLang?.short ?? 'Lang'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => {
              handleChange(lang.value)
            }}
            className={lang.value === currentLocale ? 'bg-muted' : ''}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
