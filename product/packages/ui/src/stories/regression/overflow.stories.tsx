import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../generic/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../generic/components/card'

const meta = {
  title: 'Regression/Overflow',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const LongText: Story = {
  render: () => (
    <Card className="w-88">
      <CardHeader>
        <CardTitle>
          Extremely long component title that should wrap without breaking the
          card layout
        </CardTitle>
        <CardDescription>
          This regression story keeps long labels, descriptions, and actions in
          view.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="wrap-break-word text-muted-foreground">
          @tenzyu/ui/some-very-long-component-entry-that-must-not-overflow
        </p>
        <Button className="max-w-full whitespace-normal">
          Button label with intentionally long text
        </Button>
      </CardContent>
    </Card>
  ),
}
