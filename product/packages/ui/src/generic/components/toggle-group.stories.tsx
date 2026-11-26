import type { Meta, StoryObj } from '@storybook/react-vite'

import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToggleGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ToggleGroup defaultValue={["preview"]} spacing={0}>
      <ToggleGroupItem value="preview">Preview</ToggleGroupItem>
      <ToggleGroupItem value="code">Code</ToggleGroupItem>
      <ToggleGroupItem value="tokens">Tokens</ToggleGroupItem>
    </ToggleGroup>
  ),
}
