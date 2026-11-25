import type { Meta, StoryObj } from '@storybook/react-vite'

import { Slider } from './slider'

const meta = {
  title: 'Components/Slider',
  component: Slider,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'w-80',
    defaultValue: [45],
  },
}

export const Range: Story = {
  args: {
    className: 'w-80',
    defaultValue: [25, 75],
  },
}
