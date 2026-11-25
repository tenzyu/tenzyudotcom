'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  type ReactNode,
  startTransition,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button } from '@tenzyu/ui/button'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import {
  ScrapWorkspace,
  type ScrapWorkspaceMode,
} from '@/features/scraps/editor/scrap-workspace'
import type { ScrapWorkspaceView } from '@/features/scraps/editor/scrap-workspace.validation'
import {
  isPublicScrap,
  isValidScrapSlug,
  type ScrapIndexEntry,
} from '@/features/scraps/scraps.domain'
import { AdminEditorDialog } from '@/features/content-editor/ui/admin-editor-dialog'

type Selection = { kind: 'new' | 'list' } | { kind: 'scrap'; slug: string }

export function PrivateScrapList({ locale }: { locale: string }) {
  const ja = locale === 'ja'
  const router = useRouter()
  const params = useSearchParams()
  const draft = params.get('draft')
  const [selection, setSelection] = useState<Selection>({ kind: 'list' })
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (draft && isValidScrapSlug(draft)) {
      setSelection({ kind: 'scrap', slug: draft })
      setOpen(true)
    }
  }, [draft])
  const draftButton = useRef<HTMLButtonElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  function show(next: Selection, button: HTMLButtonElement) {
    trigger.current = button
    setSelection(next)
    setOpen(true)
  }

  function close() {
    setOpen(false)
    if (new URLSearchParams(window.location.search).has('draft')) {
      router.replace(buildLocalizedUrl('/scraps', locale), { scroll: false })
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={(event) => show({ kind: 'new' }, event.currentTarget)}
        >
          {ja ? 'Scrap の下書きを作る' : 'Create a scrap'}
        </Button>
        <Button
          type="button"
          variant="outline"
          ref={draftButton}
          onClick={(event) => show({ kind: 'list' }, event.currentTarget)}
        >
          {ja ? '下書きとアーカイブ' : 'Drafts and archive'}
        </Button>
      </div>
      {open && (
        <PrivateScrapDialog
          locale={locale}
          trigger={trigger.current ? trigger : draftButton}
          onClose={close}
        >
          {selection.kind === 'list' ? (
            <PrivateScrapPicker
              locale={locale}
              onPick={(slug) => setSelection({ kind: 'scrap', slug })}
            />
          ) : (
            <ScrapWorkspace
              locale={locale}
              slug={selection.kind === 'scrap' ? selection.slug : undefined}
              onCommitted={() => startTransition(() => router.refresh())}
            />
          )}
        </PrivateScrapDialog>
      )}
    </>
  )
}

export function ScrapDetailDialog({
  locale,
  slug,
  mode,
  trigger,
  onClose,
  onCommitted,
}: {
  locale: string
  slug: string
  mode: ScrapWorkspaceMode
  trigger: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  onCommitted: (view: ScrapWorkspaceView) => void
}) {
  return (
    <PrivateScrapDialog locale={locale} trigger={trigger} onClose={onClose}>
      <ScrapWorkspace
        locale={locale}
        slug={slug}
        initialMode={mode}
        onCommitted={onCommitted}
      />
    </PrivateScrapDialog>
  )
}

function PrivateScrapDialog({
  locale,
  children,
  trigger,
  onClose,
}: {
  locale: string
  children: ReactNode
  trigger: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const ja = locale === 'ja'
  const content = useRef<HTMLDivElement>(null)
  function close() {
    if (content.current?.querySelector('[aria-busy="true"]')) return
    if (
      content.current?.querySelector('form') &&
      !window.confirm(
        ja
          ? 'Scrap の編集を閉じますか？'
          : 'Close the Scrap editor and discard any unsaved changes?',
      )
    )
      return
    onClose()
  }
  return (
    <AdminEditorDialog
      title={ja ? 'Scrap の編集' : 'Scrap editor'}
      pending={false}
      trigger={trigger}
      onClose={close}
      className="sm:max-w-3xl"
    >
      <div ref={content}>{children}</div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={close}>
          {ja ? '閉じる' : 'Close editor'}
        </Button>
      </div>
    </AdminEditorDialog>
  )
}

function PrivateScrapPicker({
  locale,
  onPick,
}: {
  locale: string
  onPick: (slug: string) => void
}) {
  const [attempt, setAttempt] = useState(0)
  return (
    <PrivateScrapChoices
      key={attempt}
      locale={locale}
      onPick={onPick}
      onRetry={() => setAttempt(attempt + 1)}
    />
  )
}

function PrivateScrapChoices({
  locale,
  onPick,
  onRetry,
}: {
  locale: string
  onPick: (slug: string) => void
  onRetry: () => void
}) {
  const ja = locale === 'ja'
  const [drafts, setDrafts] = useState<readonly ScrapIndexEntry[]>()
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    void import('@/features/scraps/editor/scrap-workspace-client')
      .then((module) => module.readPrivateScrapIndex())
      .then(
        (items) => {
          if (active) setDrafts(items.filter((item) => !isPublicScrap(item)))
        },
        () => {
          if (active) setError(true)
        },
      )
    return () => {
      active = false
    }
  }, [])
  if (error)
    return (
      <div className="space-y-2">
        <p role="alert">
          {ja
            ? '下書きを読み込めませんでした。'
            : 'The drafts could not be loaded.'}
        </p>
        <Button type="button" onClick={onRetry}>
          {ja ? '再読み込み' : 'Retry read'}
        </Button>
      </div>
    )
  if (!drafts)
    return <p role="status">{ja ? '読み込み中…' : 'Loading drafts…'}</p>
  if (!drafts.length)
    return (
      <p>
        {ja
          ? '下書きやアーカイブはありません。'
          : 'There are no drafts or archived Scraps.'}
      </p>
    )
  return (
    <ul className="divide-y border-y">
      {drafts.map((item) => (
        <li key={item.slug} className="flex min-w-0 items-center gap-2 py-1">
          <Button
            type="button"
            variant="ghost"
            className="h-auto max-w-full justify-start whitespace-normal text-left"
            onClick={() => onPick(item.slug)}
          >
            {item.title}
          </Button>
          <span className="text-xs text-muted-foreground">
            {item.status === 'archived'
              ? ja
                ? 'アーカイブ'
                : 'Archived'
              : ja
                ? '下書き'
                : 'Draft'}
          </span>
        </li>
      ))}
    </ul>
  )
}
