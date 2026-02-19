'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn-ui/card'

import { ControlPanel } from './components/control-panel'
import { PreviewPanel } from './components/preview-panel'
import { SettingsPanel } from './components/settings-panel'
import { useDotGeneration } from './use-dot-generation'

export default function DotTypePage() {
  const {
    inputText,
    setInputText,
    fontSize,
    setFontSize,
    threshold,
    setThreshold,
    pixelChar,
    setPixelChar,
    emptyChar,
    setEmptyChar,
    orientation,
    setOrientation,
    outputText,
    copyToClipboard,
    isCopied,
  } = useDotGeneration()

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Dot Type Generator</CardTitle>
          <CardDescription>
            テキストを入力すると、ドット絵のようなテキスト（アスキーアート風）に変換します。
            TwitterなどのSNSでの投稿に最適です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ControlPanel
            inputText={inputText}
            setInputText={setInputText}
            orientation={orientation}
            setOrientation={setOrientation}
          />
          <SettingsPanel
            fontSize={fontSize}
            setFontSize={setFontSize}
            threshold={threshold}
            setThreshold={setThreshold}
            pixelChar={pixelChar}
            setPixelChar={setPixelChar}
            emptyChar={emptyChar}
            setEmptyChar={setEmptyChar}
          />
          <PreviewPanel
            outputText={outputText}
            onCopy={copyToClipboard}
            isCopied={isCopied}
          />
        </CardContent>
      </Card>
    </div>
  )
}
