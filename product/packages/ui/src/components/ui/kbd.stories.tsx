import type { Meta, StoryObj } from '@storybook/react-vite'

import { Kbd, KbdGroup } from './kbd'

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Kbd>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
      <KbdGroup>
        <Kbd>Shift</Kbd>
        <Kbd>/</Kbd>
      </KbdGroup>
    </div>
  ),
}
