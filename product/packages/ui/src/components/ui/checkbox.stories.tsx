import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Checkbox } from './checkbox'

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

function CheckboxExample() {
  const [checked, setChecked] = useState(true)

  return (
    <div className="flex items-center gap-3">
      <Checkbox checked={checked} onCheckedChange={(nextChecked) => setChecked(nextChecked === true)} />
      <span className="text-sm">Checked state: {String(checked)}</span>
    </div>
  )
}

export const Default: Story = {
  render: () => <CheckboxExample />,
}
