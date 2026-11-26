'use client'

import { ThemeProvider as NextThemeProvider, type ThemeProviderProps } from 'next-themes'

// The design system uses a class-based dark variant. Delegate storage,
// hydration and system preference synchronization to the upstream provider.
export function ThemeProvider(props: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      {...props}
    />
  )
}
