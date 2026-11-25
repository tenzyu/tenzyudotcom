'use client'

import {
  lazy,
  type KeyboardEvent,
  Suspense,
  useId,
  useRef,
  useState,
} from 'react'
import { Bold, Code, Italic, Link2, List, Undo2 } from 'lucide-react'
import { Button } from '@tenzyu/ui/button'
import { Textarea } from '@tenzyu/ui/textarea'
import {
  reconcileSourceInput,
  replaceSourceRange,
  textareaText,
} from './source-text.domain'

const SourcePreview = lazy(() =>
  import('./source-preview').then((module) => ({
    default: module.SourcePreview,
  })),
)

type Format =
  | 'bold'
  | 'italic'
  | 'link'
  | 'list'
  | 'code'
  | 'kofi'
  | 'evidence'
  | 'decision'
type Position = { start: number; end: number }
type PreviousEdit = Position & { source: string }

function markup(format: Format, selection: string) {
  switch (format) {
    case 'bold':
      return { before: '**', content: selection || 'text', after: '**' }
    case 'italic':
      return { before: '*', content: selection || 'text', after: '*' }
    case 'link':
      return {
        before: '[',
        content: selection || 'link text',
        after: '](https://example.com)',
      }
    case 'list':
      return {
        before: '',
        content: (selection || 'item')
          .split('\n')
          .map((line) => `- ${line}`)
          .join('\n'),
        after: '',
      }
    case 'code':
      return {
        before: '\n\n```\n',
        content: selection || 'code',
        after: '\n```\n\n',
      }
    case 'kofi':
      return {
        before: '\n\n<KoFiLink label="',
        content: selection.replaceAll('"', '&quot;') || 'Support on Ko-fi',
        after: '" />\n\n',
      }
    case 'evidence':
      return {
        before: '\n\n<Evidence>\n\n',
        content: selection || 'Evidence goes here.',
        after: '\n\n</Evidence>\n\n',
      }
    case 'decision':
      return {
        before: '\n\n<Decision>\n\n',
        content: selection || 'Decision goes here.',
        after: '\n\n</Decision>\n\n',
      }
  }
}

export function SourceField({
  label,
  name,
  source,
  onChange,
  kind,
  locale = 'en',
  required = false,
  disabled = false,
}: {
  label: string
  name?: string
  source: string
  onChange: (source: string) => void
  kind: 'blog' | 'scrap'
  locale?: string
  required?: boolean
  disabled?: boolean
}) {
  const inputId = useId()
  const input = useRef<HTMLTextAreaElement>(null)
  const history = useRef<PreviousEdit[]>([])
  const beforeInput = useRef<Position | null>(null)
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const ja = locale === 'ja'
  const tools = [
    {
      format: 'bold',
      label: ja ? '太字' : 'Bold',
      icon: Bold,
      shortcut: 'Control+b Meta+b',
    },
    {
      format: 'italic',
      label: ja ? '斜体' : 'Italic',
      icon: Italic,
      shortcut: 'Control+i Meta+i',
    },
    {
      format: 'link',
      label: ja ? 'リンク' : 'Link',
      icon: Link2,
      shortcut: 'Control+k Meta+k',
    },
    { format: 'list', label: ja ? '箇条書き' : 'List', icon: List },
    { format: 'code', label: ja ? 'コードブロック' : 'Code block', icon: Code },
  ] as const

  function remember(position: Position) {
    history.current = [...history.current.slice(-39), { source, ...position }]
  }

  function select({ start, end }: Position) {
    requestAnimationFrame(() => {
      input.current?.focus()
      input.current?.setSelectionRange(start, end)
    })
  }

  function insert(format: Format) {
    if (disabled || !input.current) return
    const { selectionStart: start, selectionEnd: end, value } = input.current
    const { before, content, after } = markup(format, value.slice(start, end))
    remember({ start, end })
    onChange(replaceSourceRange(source, start, end, before + content + after))
    const nextStart =
      start +
      (format === 'link' && start !== end
        ? before.length + content.length + 2
        : before.length)
    select({
      start: nextStart,
      end:
        nextStart +
        (format === 'link' && start !== end
          ? 'https://example.com'.length
          : content.length),
    })
  }

  function undo() {
    const previous = history.current.pop()
    if (!previous) return
    onChange(previous.source)
    select(previous)
  }

  function keyboard(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      (!event.metaKey && !event.ctrlKey) ||
      event.altKey ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    )
      return
    const shortcut = event.key.toLowerCase()
    if (shortcut === 'z' && history.current.length) {
      event.preventDefault()
      undo()
      return
    }
    const format =
      shortcut === 'b'
        ? 'bold'
        : shortcut === 'i'
          ? 'italic'
          : shortcut === 'k'
            ? 'link'
            : null
    if (format) {
      event.preventDefault()
      insert(format)
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={mode === 'write'}
            onClick={() => setMode('write')}
          >
            {ja ? '入力' : 'Write'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={mode === 'preview'}
            onClick={() => setMode('preview')}
          >
            {ja ? 'プレビュー' : 'Preview'}
          </Button>
        </div>
      </div>
      {mode === 'write' && (
        <div className="flex flex-wrap gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.format}
              type="button"
              size="icon-sm"
              variant="outline"
              title={tool.label}
              aria-label={tool.label}
              aria-keyshortcuts={'shortcut' in tool ? tool.shortcut : undefined}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insert(tool.format)}
            >
              <tool.icon aria-hidden />
            </Button>
          ))}
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            title={ja ? '元に戻す' : 'Undo'}
            aria-label={ja ? '元に戻す' : 'Undo'}
            disabled={disabled || history.current.length === 0}
            onClick={undo}
          >
            <Undo2 aria-hidden />
          </Button>
          {(kind === 'blog'
            ? (['kofi'] as const)
            : (['evidence', 'decision'] as const)
          ).map((format) => (
            <Button
              key={format}
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insert(format)}
            >
              {format === 'kofi'
                ? 'KoFiLink'
                : format === 'evidence'
                  ? 'Evidence'
                  : 'Decision'}
            </Button>
          ))}
        </div>
      )}
      <Textarea
        id={inputId}
        name={name}
        ref={input}
        hidden={mode === 'preview'}
        className={`min-h-42 resize-y font-mono text-sm ${mode === 'preview' ? 'hidden' : ''}`}
        value={textareaText(source)}
        required={required && mode === 'write'}
        disabled={disabled}
        onKeyDown={keyboard}
        onBeforeInput={(event) => {
          beforeInput.current = {
            start: event.currentTarget.selectionStart,
            end: event.currentTarget.selectionEnd,
          }
        }}
        onChange={(event) => {
          const next = reconcileSourceInput(source, event.target.value)
          if (source === next) return
          remember(
            beforeInput.current ?? {
              start: event.target.selectionStart,
              end: event.target.selectionEnd,
            },
          )
          beforeInput.current = null
          onChange(next)
        }}
      />
      {mode === 'preview' && (
        <Suspense
          fallback={
            <p role="status">
              {ja ? 'プレビューを読み込み中…' : 'Loading preview…'}
            </p>
          }
        >
          <SourcePreview source={source} locale={locale} />
        </Suspense>
      )}
    </div>
  )
}
