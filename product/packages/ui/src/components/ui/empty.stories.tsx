import type { Meta, StoryObj } from '@storybook/react-vite'
import { InboxIcon, PlusIcon } from 'lucide-react'

import { Button } from './button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty'

const meta = {
  title: 'Components/Empty',
  component: Empty,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Empty>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Empty className="w-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>No components found</EmptyTitle>
        <EmptyDescription>
          Adjust filters or create a new component entry.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">
          <PlusIcon /> Create component
        </Button>
      </EmptyContent>
    </Empty>
  ),
}
