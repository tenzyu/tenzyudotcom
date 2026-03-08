'use client'

import { Moon, Sun } from 'lucide-react'
import { useIntlayer } from 'next-intlayer'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeSwitcher() {
  const content = useIntlayer('themeSwitcher')
  const { theme, resolvedTheme, setTheme } = useTheme()

  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const isDark = currentTheme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="soft"
          size="icon"
          onClick={() => {
            setTheme(isDark ? 'light' : 'dark')
          }}
          className="relative shrink-0"
          aria-label={content.toggleLabel.value}
        >
          <span className="sr-only">{content.toggleLabel.value}</span>
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{content.toggleLabel.value}</TooltipContent>
    </Tooltip>
  )
}
