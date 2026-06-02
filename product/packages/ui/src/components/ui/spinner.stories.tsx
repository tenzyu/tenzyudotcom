import type { Meta, StoryObj } from '@storybook/react-vite'

import { Spinner } from './spinner'
import { Button } from './button'

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner />
      <Button disabled>
        <Spinner /> Loading
      </Button>
    </div>
  ),
}
