import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarIcon } from 'lucide-react'

import { Button } from './button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './button-group'

const meta = {
  title: 'Components/ButtonGroup',
  component: ButtonGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ButtonGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Day</Button>
      <Button variant="outline">Week</Button>
      <ButtonGroupSeparator />
      <ButtonGroupText>
        <CalendarIcon /> Today
      </ButtonGroupText>
    </ButtonGroup>
  ),
}
