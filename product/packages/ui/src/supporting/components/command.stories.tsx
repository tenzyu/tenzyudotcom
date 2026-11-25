import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchIcon, SettingsIcon } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command'

const meta = {
  title: 'Components/Command',
  component: Command,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Command>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Command className="w-96 border shadow-sm">
      <CommandInput placeholder="Search commands" />
      <CommandList>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <SearchIcon /> Search <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <SettingsIcon /> Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>Export</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
}
