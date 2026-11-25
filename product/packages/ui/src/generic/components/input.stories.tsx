import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'

const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'w-80',
    placeholder: 'hello@example.com',
    type: 'email',
  },
}

export const Invalid: Story = {
  args: {
    className: 'w-80',
    placeholder: 'hello@example.com',
    type: 'email',
    'aria-invalid': true,
  },
}
