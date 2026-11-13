import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from './button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from './combobox'

const options = ['React', 'Next.js', 'Vite', 'Remix', 'Astro']

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Combobox>

export default meta

type Story = StoryObj<typeof meta>

function ComboboxExample() {
  const [value, setValue] = useState('React')

  return (
    <div className="w-full max-w-sm space-y-3">
      <Combobox value={value} onValueChange={(nextValue) => setValue(nextValue ?? '')}>
        <ComboboxInput placeholder="Search framework" showClear />
        <ComboboxContent>
          <ComboboxList>
            <ComboboxEmpty>No framework found.</ComboboxEmpty>
            <ComboboxGroup>
              <ComboboxLabel>Frameworks</ComboboxLabel>
              {options.map((option) => (
                <ComboboxItem key={option} value={option}>
                  {option}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <Button variant="outline" size="sm" onClick={() => setValue('React')}>
        Reset selection
      </Button>
    </div>
  )
}

export const Default: Story = {
  render: () => <ComboboxExample />,
}

export const EmptyState: Story = {
  render: () => (
    <Combobox defaultValue="Unknown">
      <ComboboxInput placeholder="Search framework" showClear />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>No framework found.</ComboboxEmpty>
          <ComboboxGroup>
            <ComboboxLabel>Frameworks</ComboboxLabel>
            <ComboboxItem value="React">React</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ),
}
