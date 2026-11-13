import type { Meta, StoryObj } from '@storybook/react-vite'

import { Progress, ProgressLabel, ProgressValue } from './progress'

const meta = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  args: {
    value: 68,
  },
} satisfies Meta<typeof Progress>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Progress {...args} className="w-80">
      <ProgressLabel>Story coverage</ProgressLabel>
      <ProgressValue />
    </Progress>
  ),
}
