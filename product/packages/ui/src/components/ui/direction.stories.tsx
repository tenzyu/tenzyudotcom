import type { Meta, StoryObj } from '@storybook/react-vite'

import { DirectionProvider } from './direction'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'Components/DirectionProvider',
  component: DirectionProvider,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DirectionProvider>

export default meta

type Story = StoryObj<typeof meta>

export const RTL: Story = {
  render: () => (
    <DirectionProvider direction="rtl">
      <div className="w-80 rounded-lg border p-4" dir="rtl">
        <Label htmlFor="rtl-input">RTL field</Label>
        <Input id="rtl-input" className="mt-2" defaultValue="واجهة عربية" />
      </div>
    </DirectionProvider>
  ),
}
