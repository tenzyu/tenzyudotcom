import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRightIcon, LoaderCircleIcon, Trash2Icon } from 'lucide-react'

import { Button } from './button'

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button>
        Continue
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Button variant="outline">
        <Trash2Icon data-icon="inline-start" />
        Delete
      </Button>
      <Button variant="secondary" aria-busy="true">
        <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
        Processing
      </Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Next">
        <ArrowRightIcon />
      </Button>
    </div>
  ),
}
