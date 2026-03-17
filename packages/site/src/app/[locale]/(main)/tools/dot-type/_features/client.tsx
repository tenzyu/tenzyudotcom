'use client'

import { useIntlayer } from 'next-intlayer'
import { Content } from '@/app/[locale]/_features/content'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useDotGeneration } from './use-dot-generation'
import { ControlPanel } from './control-panel'
import { PreviewPanel } from './preview-panel'
import { SettingsPanel } from './settings-panel'

export const DotTypeContent: React.FC = () => {
  const content = useIntlayer('page-dot-type')

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
    </Content>
  )
}
