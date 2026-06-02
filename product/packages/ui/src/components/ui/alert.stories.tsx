import type { Meta, StoryObj } from '@storybook/react-vite'
import { InfoIcon, ShieldAlertIcon } from 'lucide-react'

import { Button } from './button'
import { Alert, AlertAction, AlertDescription, AlertTitle } from './alert'

const meta = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Alert>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="grid w-96 gap-3">
      <Alert>
        <InfoIcon />
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>Default alert with supporting copy.</AlertDescription>
        <AlertAction><Button size="sm" variant="outline">View</Button></AlertAction>
      </Alert>
      <Alert variant="destructive">
        <ShieldAlertIcon />
        <AlertTitle>Destructive</AlertTitle>
        <AlertDescription>Critical state uses destructive tokens.</AlertDescription>
      </Alert>
    </div>
  ),
}
