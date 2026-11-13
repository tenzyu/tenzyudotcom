import type { Meta, StoryObj } from '@storybook/react-vite'

import { Calendar } from './calendar'

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Calendar>

export default meta

type Story = StoryObj<typeof meta>

export const SingleDate: Story = {
  args: {
    mode: 'single',
    month: new Date(2026, 5, 1),
    selected: new Date(2026, 5, 2),
  },
}

export const Range: Story = {
  args: {
    mode: 'range',
    month: new Date(2026, 5, 1),
    selected: {
      from: new Date(2026, 5, 8),
      to: new Date(2026, 5, 12),
    },
  },
}
