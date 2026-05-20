import type { Decorator } from '@storybook/react-vite'

import { ThemeProvider } from '../components/theme-provider'

export const withThemeProvider: Decorator = (Story) => (
  <ThemeProvider defaultTheme="dark" storageKey="storybook-theme">
    <div className="min-h-screen bg-background p-6 text-foreground">
      <Story />
    </div>
  </ThemeProvider>
)
