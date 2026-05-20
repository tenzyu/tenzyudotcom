import type { Preview } from '@storybook/react-vite'

import '../src/index.css'
import { ThemeProvider } from '../src/components/theme-provider'

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
      <ThemeProvider defaultTheme="dark" storageKey="storybook-theme">
        <div className="min-h-screen bg-background p-6 text-foreground">
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}

export default preview
