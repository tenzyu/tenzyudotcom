import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileIcon } from 'lucide-react'

import { Badge } from './badge'
import { Button } from './button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from './item'

const meta = {
  title: 'Components/Item',
  component: Item,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Item>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ItemGroup className="w-96">
      <Item variant="outline">
        <ItemMedia variant="icon"><FileIcon /></ItemMedia>
        <ItemContent>
          <ItemTitle>button.tsx</ItemTitle>
          <ItemDescription>Primitive with variants and sizes.</ItemDescription>
        </ItemContent>
        <ItemActions><Badge variant="secondary">UI</Badge></ItemActions>
      </Item>
      <ItemSeparator />
      <Item variant="muted" size="sm">
        <ItemHeader><ItemTitle>Header</ItemTitle><Badge>New</Badge></ItemHeader>
        <ItemDescription>Header and footer slots are visible.</ItemDescription>
        <ItemFooter><span>Updated today</span><Button size="sm" variant="outline">Open</Button></ItemFooter>
      </Item>
    </ItemGroup>
  ),
}
