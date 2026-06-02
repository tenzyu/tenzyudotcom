import type { Meta, StoryObj } from '@storybook/react-vite'

import { ScrollArea } from './scroll-area'

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ScrollArea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-72 rounded-lg border p-4">
      <div className="flex flex-col gap-3 text-sm">
        {Array.from({ length: 16 }, (_, index) => (
          <p key={index}>Scrollable content row {index + 1}</p>
        ))}
      </div>
    </ScrollArea>
  ),
}
