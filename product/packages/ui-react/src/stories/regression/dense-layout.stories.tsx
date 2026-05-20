import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

const meta = {
  title: 'Regression/DenseLayout',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Card key={index} size="sm">
          <CardHeader>
            <CardTitle>Item {index + 1}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Queued</span>
            <Button size="xs" variant="outline">
              Open
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}
