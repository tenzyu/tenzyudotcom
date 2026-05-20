import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

const meta = {
  title: 'Regression/DarkMode',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const SideBySide: Story = {
  render: () => (
    <div className="grid gap-3 md:grid-cols-2">
      {[
        { label: 'Light', className: 'light' },
        { label: 'Dark', className: 'dark' },
      ].map((theme) => (
        <div
          key={theme.label}
          className={`${theme.className} rounded-lg border bg-background p-4 text-foreground`}
        >
          <Card>
            <CardHeader>
              <CardTitle>{theme.label} surface</CardTitle>
              <CardDescription>Token contrast check</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button>Primary</Button>
              <Button variant="outline">Outline</Button>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  ),
}
