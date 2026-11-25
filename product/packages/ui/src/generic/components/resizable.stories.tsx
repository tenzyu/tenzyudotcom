import type { Meta, StoryObj } from '@storybook/react-vite'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'

const meta = {
  title: 'Components/Resizable',
  component: ResizablePanelGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ResizablePanelGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ResizablePanelGroup className="h-48 w-[32rem] rounded-lg border">
      <ResizablePanel defaultSize={60} className="grid place-items-center">
        Main panel
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} className="grid place-items-center">
        Side panel
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
