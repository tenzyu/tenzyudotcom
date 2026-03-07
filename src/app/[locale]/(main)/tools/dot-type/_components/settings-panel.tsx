import { useIntlayer } from 'next-intlayer'
import type { Dispatch, SetStateAction } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

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
  const { labels } = useIntlayer('dotType')
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{labels.fontSize}</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[fontSize]}
              min={8}
              max={48}
              step={1}
              onValueChange={(value) => {
                setFontSize(value[0] ?? 8)
              }}
              className="flex-1"
            />
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => {
                setFontSize(Number(e.target.value))
              }}
              min={8}
              max={48}
              className="w-20"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{labels.threshold}</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[threshold]}
              min={0}
              max={255}
              step={1}
              onValueChange={(value) => {
                setThreshold(value[0] ?? 0)
              }}
              className="flex-1"
            />
            <Input
              type="number"
              value={threshold}
              onChange={(e) => {
                setThreshold(Number(e.target.value))
              }}
              min={0}
              max={255}
              className="w-20"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{labels.pixelChar}</Label>
          <Input
            value={pixelChar}
            onChange={(e) => {
              setPixelChar(e.target.value)
            }}
            maxLength={1}
          />
        </div>
        <div className="space-y-2">
          <Label>{labels.emptyChar}</Label>
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
