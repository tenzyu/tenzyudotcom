import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Collapsible>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-96">
      <Collapsible defaultOpen>
        <CollapsibleTrigger render={<Button variant="outline" />}>Show details</CollapsibleTrigger>
        <CollapsibleContent className="mt-3 rounded-lg border p-3 text-sm text-muted-foreground">
          Collapsible content stays hidden until the trigger is activated.
        </CollapsibleContent>
      </Collapsible>
    </div>
  ),
}
