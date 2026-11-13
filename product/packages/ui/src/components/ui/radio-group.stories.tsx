import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field, FieldLabel } from './field'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="manual" className="w-80">
      <Field orientation="horizontal">
        <RadioGroupItem value="auto" />
        <FieldLabel>Automatic</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem value="manual" />
        <FieldLabel>Manual</FieldLabel>
      </Field>
    </RadioGroup>
  ),
}
