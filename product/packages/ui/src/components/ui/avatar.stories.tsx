import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar'

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Avatar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar size="lg">
        <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn" />
        <AvatarFallback>SC</AvatarFallback>
        <AvatarBadge />
      </Avatar>
      <Avatar>
        <AvatarFallback>TY</AvatarFallback>
      </Avatar>
      <Avatar size="sm">
        <AvatarFallback>UI</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+8</AvatarGroupCount>
    </AvatarGroup>
  ),
}
