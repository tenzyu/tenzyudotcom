import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
        <Label>プレビュー (コピーして使用してください)</Label>
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
