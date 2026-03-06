import { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ControlPanelProps = {
  inputText: string
  setInputText: Dispatch<SetStateAction<string>>
  orientation: 'horizontal' | 'vertical'
  setOrientation: Dispatch<SetStateAction<'horizontal' | 'vertical'>>
}

export function ControlPanel({
  inputText,
  setInputText,
  orientation,
  setOrientation,
}: ControlPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>入力テキスト</Label>
        <Input
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value)
          }}
          placeholder="テキストを入力してください"
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>文字の向き</Label>
        <div className="flex gap-4">
          <Button
            variant={orientation === 'horizontal' ? 'default' : 'outline'}
            onClick={() => {
              setOrientation('horizontal')
            }}
            size="sm"
          >
            横書き
          </Button>
          <Button
            variant={orientation === 'vertical' ? 'default' : 'outline'}
            onClick={() => {
              setOrientation('vertical')
            }}
            size="sm"
          >
            縦書き
          </Button>
        </div>
      </div>
    </div>
  )
}
