import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Project summary</CardTitle>
        <CardDescription>Design system package health</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Open
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Components, stories, and package exports are reviewed together.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Review changes</Button>
      </CardFooter>
    </Card>
  ),
}

export const Compact: Story = {
  render: () => (
    <Card size="sm" className="w-72">
      <CardHeader>
        <CardTitle>Compact card</CardTitle>
        <CardDescription>Reduced spacing for dense panels</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Use compact cards in repeated operational layouts.
        </p>
      </CardContent>
    </Card>
  ),
}

export const Grid: Story = {
  parameters: {
    layout: 'padded',
  },
  render: () => (
    <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
      {['Foundation', 'Components', 'Patterns'].map((title) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>Storybook section</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A focused surface for visual inspection.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}
