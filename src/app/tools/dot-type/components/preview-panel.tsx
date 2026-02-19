import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/shadcn-ui/button'
import { Textarea } from '@/components/shadcn-ui/textarea'

type PreviewPanelProps = {
  outputText: string
  onCopy: () => void
  isCopied: boolean
}

export function PreviewPanel({
  outputText,
  onCopy,
  isCopied,
}: PreviewPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          プレビュー (コピーして使用してください)
        </label>
        <Button
          onClick={onCopy}
          size="sm"
          variant={isCopied ? 'outline' : 'default'}
        >
          {isCopied ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {isCopied ? 'コピーしました' : 'コピー'}
        </Button>
      </div>
      <Textarea
        value={outputText}
        readOnly
        className="min-h-[300px] resize-y font-mono text-xs leading-none tracking-tighter whitespace-pre"
        style={{
          lineHeight: '1em',
        }}
      />
    </div>
  )
}
