'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeSwitcher() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === 'system' ? resolvedTheme : theme
  const isDark = currentTheme === 'dark'

  return (
    <button
      onClick={() => {
        setTheme(isDark ? 'light' : 'dark')
      }}
      className="bg-accent hover:bg-accent/80 focus-visible:ring-ring focus-visible:ring-offset-background border-border/50 relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border p-1 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label="Toggle theme"
    >
      <div className="z-0 flex w-full items-center justify-between px-1">
        <Sun className="text-muted-foreground/70 h-4 w-4" />
        <Moon className="text-muted-foreground/70 h-4 w-4" />
      </div>
      <span
        className={`bg-background absolute left-1 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all duration-300 ease-in-out ${
          mounted && isDark ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        {mounted ? (
          isDark ? (
            <Moon className="text-foreground h-3.5 w-3.5" />
          ) : (
            <Sun className="h-3.5 w-3.5 text-orange-500" />
          )
        ) : null}
      </span>
    </button>
  )
}
