import type { Preview } from '@storybook/react-vite'

import '../src/index.css'
import { useTheme } from 'next-themes'
import { ThemeProvider } from '../src/components/theme-provider'
import { useEffect } from 'react'

function ThemeShortcut() {
  const { resolvedTheme, setTheme } = useTheme()
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.key.toLowerCase() !== 'd') return
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [contenteditable=true]'))) return
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [resolvedTheme, setTheme])
  return null
}

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          'Components',
          'Patterns',
          'Regression',
        ],
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="dark" storageKey="storybook-theme" disableTransitionOnChange>
        <ThemeShortcut />
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}

export default preview
