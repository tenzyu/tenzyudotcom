import type { Decorator } from '@storybook/react-vite'
import { ThemeProvider } from '../components/theme-provider'

export const withThemeProvider: Decorator = (Story) => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="storybook-theme" disableTransitionOnChange>
    <div className="min-h-screen bg-background p-6 text-foreground">
      <Story />
    </div>
  </ThemeProvider>
)
