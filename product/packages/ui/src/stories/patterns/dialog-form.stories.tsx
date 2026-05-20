import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '../../components/ui/field'
import { Input } from '../../components/ui/input'

const meta = {
  title: 'Patterns/DialogForm',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button />}>Edit package</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Package settings</DialogTitle>
          <DialogDescription>
            Settings dialogs combine form fields with clear footer actions.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="entry">Entry point</FieldLabel>
            <Input id="entry" defaultValue="@tenzyu/ui/button" />
            <FieldDescription>
              Component entries are validated as package subpaths.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="owner">Owner</FieldLabel>
            <Input id="owner" defaultValue="Design System" />
          </Field>
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
