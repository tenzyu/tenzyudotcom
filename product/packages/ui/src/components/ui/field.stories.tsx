import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './checkbox'
import { Input } from './input'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './field'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Switch } from './switch'

const meta = {
  title: 'Components/Field',
  component: Field,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Field>

export default meta

type Story = StoryObj<typeof meta>

export const FormLayout: Story = {
  render: () => (
    <FieldGroup className="w-96">
      <Field>
        <FieldLabel htmlFor="field-email">Email</FieldLabel>
        <Input id="field-email" placeholder="hello@example.com" />
        <FieldDescription>Used for release notifications.</FieldDescription>
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="field-package">Package name</FieldLabel>
        <Input id="field-package" defaultValue="@tenzyu/app-ui" aria-invalid />
        <FieldError>Name is reserved for app-specific UI.</FieldError>
      </Field>
      <FieldSeparator>options</FieldSeparator>
      <FieldSet>
        <FieldLegend>Delivery</FieldLegend>
        <RadioGroup defaultValue="manual">
          <Field orientation="horizontal">
            <RadioGroupItem value="auto" />
            <FieldLabel>Automatic</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <RadioGroupItem value="manual" />
            <FieldLabel>Manual</FieldLabel>
          </Field>
        </RadioGroup>
      </FieldSet>
    </FieldGroup>
  ),
}

export const HorizontalControls: Story = {
  render: () => (
    <FieldGroup className="w-96">
      <Field orientation="horizontal">
        <Checkbox defaultChecked />
        <FieldContent>
          <FieldTitle>Include pre-release versions</FieldTitle>
          <FieldDescription>Show alpha and beta component entries.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Switch defaultChecked />
        <FieldLabel>Public catalog</FieldLabel>
      </Field>
    </FieldGroup>
  ),
}
