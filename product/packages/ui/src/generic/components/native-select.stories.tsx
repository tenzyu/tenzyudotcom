import type { Meta, StoryObj } from '@storybook/react-vite'

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from './native-select'

const meta = {
  title: 'Components/NativeSelect',
  component: NativeSelect,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof NativeSelect>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <NativeSelect defaultValue="stable" className="w-56">
      <NativeSelectOption value="stable">Stable</NativeSelectOption>
      <NativeSelectOptGroup label="Preview">
        <NativeSelectOption value="beta">Beta</NativeSelectOption>
        <NativeSelectOption value="alpha">Alpha</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
}
