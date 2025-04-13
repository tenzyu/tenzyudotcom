'use client'

import { Globe } from 'lucide-react'
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
  { label: '日本語', value: 'ja' },
  { label: 'English', value: 'en' },
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Change language">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
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
