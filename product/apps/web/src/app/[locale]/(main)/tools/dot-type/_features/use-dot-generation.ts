import { useCallback, useMemo, useState } from 'react'

import { type DotGenerationParams, generateDotArt } from './logic'

type DotGenerationOptions = {
  initialText?: string
}

export function useDotGeneration(options: DotGenerationOptions = {}) {
  const [inputText, setInputText] = useState(options.initialText ?? 'dot type')
  const [fontSize, setFontSize] = useState(16)
  const [threshold, setThreshold] = useState(128)
  const [pixelChar, setPixelChar] = useState('■')
  const [emptyChar, setEmptyChar] = useState('□')
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(
    'horizontal',
  )
  const [isCopied, setIsCopied] = useState(false)

  // Combine params to debounce them together
  const params: DotGenerationParams = useMemo(
    () => ({
      text: inputText,
      fontSize,
      threshold,
      pixelChar,
      emptyChar,
      orientation,
    }),
    [inputText, fontSize, threshold, pixelChar, emptyChar, orientation],
  )

  const outputText = useMemo(() => {
    return generateDotArt(params)
  }, [params])

  const copyToClipboard = useCallback(() => {
    if (!outputText) return
    void navigator.clipboard.writeText(outputText)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }, [outputText])

  return {
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
  }
}
