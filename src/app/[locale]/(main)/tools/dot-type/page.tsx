'use client'

import { useIntlayer } from 'next-intlayer'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Content } from '@/components/site/content'

import { ControlPanel } from './_components/control-panel'
import { PreviewPanel } from './_components/preview-panel'
import { SettingsPanel } from './_components/settings-panel'
import { useDotGeneration } from './use-dot-generation'

export default function DotTypePage() {
  const content = useIntlayer('dotType')
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
  } = useDotGeneration({ initialText: content.defaults.inputText.value })

  return (
    <Content size="4xl" className="py-12">
      <Card variant="soft">
        <CardHeader>
          <CardTitle className="text-2xl">{content.hero.title}</CardTitle>
          <CardDescription>{content.hero.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ControlPanel
            inputText={inputText}
            setInputText={setInputText}
            orientation={orientation}
            setOrientation={setOrientation}
            labels={content.labels.values()}
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
            labels={content.labels.values()}
          />
          <PreviewPanel
            outputText={outputText}
            onCopy={copyToClipboard}
            isCopied={isCopied}
            labels={content.labels.values()}
          />
        </CardContent>
      </Card>
    </Content>
  )
}
