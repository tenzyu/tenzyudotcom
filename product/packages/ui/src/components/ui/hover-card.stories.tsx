import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'
import { Avatar, AvatarFallback } from './avatar'

const meta = {
  title: 'Components/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof HoverCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger render={<Button variant="outline" />}>@tenzyu/ui</HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <Avatar>
            <AvatarFallback>UI</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">@tenzyu/ui</div>
            <p className="text-muted-foreground">Shared UI primitives.</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
}
