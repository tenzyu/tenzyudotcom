'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { type RefObject, useRef, useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@tenzyu/ui/button'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import { AdminGate, useSavedPage } from '@/features/content-editor/ui/admin-gate'
import { AdminEditorDialog } from '@/features/content-editor/ui/admin-editor-dialog'

const BlogWorkspace = dynamic(() =>
  import('@/app/[locale]/_features/blog-editor/blog-workspace').then(
    (module) => module.BlogWorkspace,
  ),
)

export function BlogPageEditor({
  locale,
  slug,
  compact = false,
}: {
  locale: string
  slug?: string
  compact?: boolean
}) {
  return (
    <AdminGate>
      <BlogEditorActions locale={locale} slug={slug} compact={compact} />
    </AdminGate>
  )
}

function BlogEditorActions({
  locale,
  slug,
  compact,
}: {
  locale: string
  slug?: string
  compact: boolean
}) {
  const ja = locale === 'ja'
  const [mode, setMode] = useState<'write' | 'rename'>()
  const edit = useRef<HTMLButtonElement>(null)
  const rename = useRef<HTMLButtonElement>(null)
  const editLabel = slug
    ? ja
      ? '記事を編集'
      : 'Edit post'
    : ja
      ? '記事を書く'
      : 'Create post'
  const renameLabel = ja ? 'URL を変更' : 'Change URL'
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          ref={edit}
          type="button"
          size={compact ? 'icon-sm' : 'sm'}
          variant="outline"
          aria-label={compact && slug ? `${editLabel} ${slug}` : undefined}
          onClick={() => setMode('write')}
        >
          {compact ? <Pencil aria-hidden /> : editLabel}
        </Button>
        {slug && !compact && (
          <Button
            ref={rename}
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMode('rename')}
          >
            {renameLabel}
          </Button>
        )}
      </div>
      {mode && (
        <BlogEditorDialog
          locale={locale}
          slug={slug}
          mode={mode}
          title={mode === 'rename' ? renameLabel : editLabel}
          trigger={mode === 'rename' ? rename : edit}
          onClose={() => setMode(undefined)}
        />
      )}
    </>
  )
}

function BlogEditorDialog({
  locale,
  slug,
  mode,
  title,
  trigger,
  onClose,
}: {
  locale: string
  slug?: string
  mode: 'write' | 'rename'
  title: string
  trigger: RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const router = useRouter()
  const [working, setWorking] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const saved = useSavedPage()
  const fields = useRef<HTMLDivElement>(null)
  const dirty = useRef(false)
  const ja = locale === 'ja'
  function close() {
    if (
      working ||
      refreshing ||
      fields.current?.querySelector('[aria-busy="true"]')
    )
      return
    if (
      dirty.current &&
      !window.confirm(
        ja ? '未保存の変更を破棄しますか？' : 'Discard unsaved changes?',
      )
    )
      return
    onClose()
  }
  return (
    <AdminEditorDialog
      title={title}
      trigger={trigger}
      pending={working || refreshing}
      onClose={close}
      className="sm:max-w-3xl"
    >
      <div
        ref={fields}
        onChangeCapture={() => {
          dirty.current = true
        }}
      >
        <BlogWorkspace
          locale={locale}
          mode={mode}
          slug={slug}
          onBusyChange={setWorking}
          onDraftChange={() => {
            dirty.current = true
          }}
          onSaved={(article, renamed) => {
            dirty.current = false
            if (renamed) {
              onClose()
              saved(
                ja ? 'URL を変更しました' : 'URL changed',
                buildLocalizedUrl(`/blog/${article.slug}`, locale),
              )
            } else {
              startTransition(() => router.refresh())
            }
          }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={working || refreshing}
          onClick={close}
        >
          {ja ? '閉じる' : 'Close editor'}
        </Button>
      </div>
    </AdminEditorDialog>
  )
}
