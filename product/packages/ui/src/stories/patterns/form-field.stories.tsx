import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { StoryPage, StorySection } from '../../testing/story-helpers'

const meta = {
  title: 'Patterns/FormField',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <StoryPage className="max-w-md">
      <StorySection title="Default">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="project-name">Project name</FieldLabel>
            <Input id="project-name" defaultValue="Storybook setup" />
            <FieldDescription>
              Use a concise name that can fit in dense navigation.
            </FieldDescription>
          </Field>
          <Field data-invalid="true">
            <FieldLabel htmlFor="package-name">Package name</FieldLabel>
            <Input id="package-name" defaultValue="@tenzyu/ui" aria-invalid />
            <FieldError>Package names cannot include source paths.</FieldError>
          </Field>
          <div>
            <Button>Save</Button>
          </div>
        </FieldGroup>
      </StorySection>
    </StoryPage>
  ),
}
