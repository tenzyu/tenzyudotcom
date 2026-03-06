import { Dispatch, SetStateAction } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SettingsPanelProps = {
  fontSize: number
  setFontSize: Dispatch<SetStateAction<number>>
  threshold: number
  setThreshold: Dispatch<SetStateAction<number>>
  pixelChar: string
  setPixelChar: Dispatch<SetStateAction<string>>
  emptyChar: string
  setEmptyChar: Dispatch<SetStateAction<string>>
}

export function SettingsPanel({
  fontSize,
  setFontSize,
  threshold,
  setThreshold,
  pixelChar,
  setPixelChar,
  emptyChar,
  setEmptyChar,
}: SettingsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>
            フォントサイズ / グリッドサイズ (px)
          </Label>
          <Input
            type="number"
            value={fontSize}
            onChange={(e) => {
              setFontSize(Number(e.target.value))
            }}
            min={8}
            max={48}
          />
        </div>
        <div className="space-y-2">
          <Label>しきい値 (0-255)</Label>
          <Input
            type="number"
            value={threshold}
            onChange={(e) => {
              setThreshold(Number(e.target.value))
            }}
            min={0}
            max={255}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>使用文字 (黒)</Label>
          <Input
            value={pixelChar}
            onChange={(e) => {
              setPixelChar(e.target.value)
            }}
            maxLength={1}
          />
        </div>
        <div className="space-y-2">
          <Label>背景文字 (白)</Label>
          <Input
            value={emptyChar}
            onChange={(e) => {
              setEmptyChar(e.target.value)
            }}
            maxLength={1}
          />
        </div>
      </div>
    </div>
  )
}
