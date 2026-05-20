import type { Meta, StoryObj } from '@storybook/react-vite'

import { accordionItems } from '../../testing/fixtures'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion'

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Accordion>

export default meta

type Story = StoryObj<typeof meta>

function AccordionExample({ multiple = false }: { multiple?: boolean }) {
  return (
    <Accordion
      defaultValue={['principles']}
      multiple={multiple}
      className="w-96 rounded-lg border bg-card px-4 text-card-foreground"
    >
      {accordionItems.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export const Default: Story = {
  render: () => <AccordionExample />,
}

export const Multiple: Story = {
  render: () => <AccordionExample multiple />,
}

export const DisabledItem: Story = {
  render: () => (
    <Accordion
      defaultValue={['api']}
      className="w-96 rounded-lg border bg-card px-4 text-card-foreground"
    >
      <AccordionItem value="api">
        <AccordionTrigger>Public API</AccordionTrigger>
        <AccordionContent>
          Components are published through package subpaths.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionTrigger>Disabled section</AccordionTrigger>
        <AccordionContent>This section cannot be expanded.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
}
