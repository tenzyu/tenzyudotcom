import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Separator } from '../../components/ui/separator'
import { navigationItems } from '../../testing/fixtures'

const meta = {
  title: 'Patterns/AppShell',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid min-h-screen bg-background text-foreground md:grid-cols-[14rem_1fr]">
      <aside className="border-b bg-sidebar p-4 text-sidebar-foreground md:border-r md:border-b-0">
        <div className="font-heading text-sm font-medium">@tenzyu</div>
        <Separator className="my-4" />
        <nav className="grid gap-1">
          {navigationItems.map((item) => (
            <Button key={item} variant="ghost" className="justify-start">
              {item}
            </Button>
          ))}
        </nav>
      </aside>
      <main className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-lg font-medium">
              Component workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              A compact shell for repeated product workflows.
            </p>
          </div>
          <Button>New component</Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {['Stories', 'Exports', 'Regression'].map((title) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Ready for review</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Shared UI checks stay visible without leaving the package.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  ),
}
