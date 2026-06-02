import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from './label'
import { Input } from './input'

const meta = {
  title: 'Components/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid w-80 gap-2">
      <Label htmlFor="label-email">Email</Label>
      <Input id="label-email" placeholder="hello@example.com" />
    </div>
  ),
}
