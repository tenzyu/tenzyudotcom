import type { Meta, StoryObj } from '@storybook/react-vite'
import { toast } from 'sonner'

import { Button } from './button'
import { Toaster } from './sonner'

const meta = {
  title: 'Components/Sonner',
  component: Toaster,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Toaster>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={() => toast('Storybook toast fired')}>Show toast</Button>
      <Toaster />
    </div>
  ),
}
