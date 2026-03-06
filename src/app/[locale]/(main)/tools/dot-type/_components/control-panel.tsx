import { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ControlPanelProps = {
  inputText: string
  setInputText: Dispatch<SetStateAction<string>>
  orientation: 'horizontal' | 'vertical'
  setOrientation: Dispatch<SetStateAction<'horizontal' | 'vertical'>>
  labels: {
    inputText: string
    inputPlaceholder: string
    orientation: string
    horizontal: string
    vertical: string
  }
}

export function ControlPanel({
  inputText,
  setInputText,
  orientation,
  setOrientation,
  labels,
}: ControlPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{labels.inputText}</Label>
        <Input
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value)
          }}
          placeholder={labels.inputPlaceholder}
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>{labels.orientation}</Label>
        <div className="flex gap-4">
          <Button
            variant={orientation === 'horizontal' ? 'default' : 'outline'}
            onClick={() => {
              setOrientation('horizontal')
            }}
            size="sm"
          >
            {labels.horizontal}
          </Button>
          <Button
            variant={orientation === 'vertical' ? 'default' : 'outline'}
            onClick={() => {
              setOrientation('vertical')
            }}
            size="sm"
          >
            {labels.vertical}
          </Button>
        </div>
      </div>
    </div>
  )
}
