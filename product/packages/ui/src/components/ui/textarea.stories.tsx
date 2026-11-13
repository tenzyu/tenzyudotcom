import type { Meta, StoryObj } from '@storybook/react-vite'

import { Textarea } from './textarea'

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'w-80',
    placeholder: 'Write release notes',
    rows: 4,
  },
}

export const Invalid: Story = {
  args: {
    className: 'w-80',
    placeholder: 'Write release notes',
    rows: 4,
    'aria-invalid': true,
  },
}
