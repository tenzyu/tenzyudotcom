import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from './button'
import { Kbd } from './kbd'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tooltip>

export default meta

type Story = StoryObj<typeof meta>

function TooltipExample() {
  const [open, setOpen] = useState(true)

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
        <TooltipContent>
          Press <Kbd>⌘K</Kbd> to search
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const Default: Story = {
  render: () => <TooltipExample />,
}
