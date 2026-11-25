'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@tenzyu/ui/button'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import {
  isPublicScrap,
  type ContentLocale,
} from '@/features/scraps/scraps.domain'
import type { ScrapEditorCommand } from './scrap-editor.validation'
import type {
  ScrapWorkspaceResult,
  ScrapWorkspaceView,
} from './scrap-workspace.validation'
import {
  readPrivateScrap,
  verifiedPublicScrap,
  writeScrap,
} from './scrap-workspace-client'
import { ScrapEntryForm, ScrapLeadForm } from './scrap-workspace-forms'

export type ScrapWorkspaceMode =
  | { kind: 'manage' | 'lead' | 'append' }
  | { kind: 'entry'; id: string }

type Failure = Exclude<ScrapWorkspaceResult, { kind: 'saved' }>
type Receipt = {
  version: string
  command: ScrapEditorCommand
  refreshed: boolean
}

function matchesCommand(view: ScrapWorkspaceView, command: ScrapEditorCommand) {
  const manifest = view.manifest
  if (command.kind !== 'create' && command.expectedVersion === view.version)
    return false
  switch (command.kind) {
    case 'set-status':
      return manifest.status === command.status
    case 'set-visibility':
      return manifest.published === command.published
    case 'create':
    case 'update':
      return (
        manifest.slug === command.slug &&
        manifest.title === command.title.trim() &&
        manifest.hypothesis === command.hypothesis.trim() &&
        (manifest.summary ?? '') === command.summary.trim() &&
        manifest.status === command.status &&
        manifest.published === command.published &&
        manifest.tags.join(',') === command.tags.join(',') &&
        view.lead.find((doc) => doc.locale === command.locale)?.source ===
          command.lead
      )
    case 'append':
    case 'edit-entry': {
      const entry = view.entries.find(
        (item) => item.meta.id === command.entryId,
      )
      return (
        entry?.meta.kind === command.entryKind &&
        entry.meta.published === command.published &&
        entry.documents.find((doc) => doc.locale === command.locale)?.source ===
          command.body
      )
    }
  }
}

export function ScrapWorkspace({
  locale,
  slug,
  initial,
  initialMode = { kind: 'manage' },
  onCommitted,
}: {
  locale: string
  slug?: string
  initial?: ScrapWorkspaceView
  initialMode?: ScrapWorkspaceMode
  onCommitted?: (view: ScrapWorkspaceView) => void
}) {
  const ja = locale === 'ja'
  const [view, setView] = useState(initial)
  const [mode, setMode] = useState(initialMode)
  const [language, setLanguage] = useState<ContentLocale>()
  const [busy, setBusy] = useState(Boolean(slug && !initial))
  const [failure, setFailure] = useState<Failure>()
  const [receipt, setReceipt] = useState<Receipt>()
  const [publicState, setPublicState] = useState<'available' | 'unchecked'>()
  const writing = useRef(false)
  const submission = useRef<ScrapEditorCommand>(null)

  async function run(action: () => Promise<void>) {
    if (writing.current) return
    writing.current = true
    setBusy(true)
    try {
      await action()
    } finally {
      writing.current = false
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!slug || initial) return
    const lifetime = new AbortController()
    void readPrivateScrap(slug).then(
      (latest) => {
        if (lifetime.signal.aborted) return
        setView(latest)
        setBusy(false)
      },
      () => {
        if (lifetime.signal.aborted) return
        setFailure({
          kind: 'unavailable',
          message: 'The Scrap could not be loaded.',
        })
        setBusy(false)
      },
    )
    return () => lifetime.abort()
  }, [slug, initial])

  async function readLatest() {
    const target = view?.manifest.slug ?? slug
    if (!target) return
    await run(async () => {
      try {
        setView(await readPrivateScrap(target))
        setFailure(undefined)
      } catch {
        setFailure({
          kind: 'unavailable',
          message: 'The Scrap could not be loaded.',
        })
      }
    })
  }

  async function finish(saved: Receipt, loaded?: ScrapWorkspaceView) {
    setReceipt(saved)
    setFailure(undefined)
    let latest: ScrapWorkspaceView
    try {
      latest = loaded ?? (await readPrivateScrap(saved.command.slug))
    } catch {
      return
    }
    if (saved.command.kind === 'create') setMode({ kind: 'manage' })
    if ('locale' in saved.command) setLanguage(saved.command.locale)
    setView(latest)
    setReceipt({ ...saved, refreshed: true })
    if (
      isPublicScrap(latest.manifest) &&
      (!view || !isPublicScrap(view.manifest))
    ) {
      setPublicState(
        (await verifiedPublicScrap(latest, locale)) ? 'available' : 'unchecked',
      )
    } else {
      setPublicState(undefined)
    }
    onCommitted?.(latest)
  }

  function save(command: ScrapEditorCommand) {
    if (
      failure?.kind === 'uncertain' ||
      failure?.kind === 'conflict' ||
      (receipt && !receipt.refreshed)
    )
      return
    void run(async () => {
      submission.current = command
      setFailure(undefined)
      const result = await writeScrap({ operation: 'save', command })
      if (result.kind === 'saved')
        await finish({ version: result.version, command, refreshed: false })
      else setFailure(result)
    })
  }

  function check() {
    const command = submission.current
    if (failure?.kind !== 'uncertain' || !command) return
    const candidate = failure.candidate
    void run(async () => {
      if (candidate) {
        const result = await writeScrap({
          operation: 'check',
          candidate,
          expectedVersion:
            'expectedVersion' in command ? command.expectedVersion : undefined,
        })
        if (result.kind === 'saved') {
          await finish({ version: result.version, command, refreshed: false })
        } else if (result.kind === 'retry') {
          setFailure(result)
        } else if (result.kind === 'uncertain') {
          setFailure({ ...result, candidate: result.candidate ?? candidate })
        } else {
          setFailure({ kind: 'uncertain', candidate, message: result.message })
        }
        return
      }
      try {
        const latest = await readPrivateScrap(command.slug)
        if (matchesCommand(latest, command)) {
          await finish(
            { version: latest.version, command, refreshed: false },
            latest,
          )
          return
        }
        if (
          'expectedVersion' in command &&
          latest.version === command.expectedVersion
        ) {
          setFailure({
            kind: 'retry',
            message:
              'Git still matches your starting revision. You can retry this draft.',
          })
          return
        }
      } catch {
        setFailure({
          kind: 'uncertain',
          message: 'Git could not be read. Your draft is kept.',
        })
        return
      }
      setFailure({
        kind: 'uncertain',
        message: 'Git has not confirmed this change. Your draft is kept.',
      })
    })
  }

  const blocked =
    busy ||
    failure?.kind === 'uncertain' ||
    failure?.kind === 'conflict' ||
    Boolean(receipt && !receipt.refreshed)
  const entry =
    mode.kind === 'entry'
      ? view?.entries.find((item) => item.meta.id === mode.id)
      : undefined
  const available =
    publicState === 'available' && view && isPublicScrap(view.manifest)
  const canShowCreate = !view && !slug && (!receipt || !receipt.refreshed)

  return (
    <div className="min-w-0 space-y-4" aria-busy={busy}>
      {busy && <p role="status">{ja ? '処理中…' : 'Working…'}</p>}
      {receipt && (
        <p role="status">
          {ja ? 'Git に保存しました' : 'Saved to Git'}{' '}
          <code className="break-all">{receipt.version}</code>
        </p>
      )}
      {receipt && !receipt.refreshed && !busy && (
        <div className="space-y-2">
          <p role="alert">
            {ja
              ? '保存後のデータを取得できませんでした。'
              : 'The saved version could not be loaded.'}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void run(() => finish(receipt))}
          >
            {ja ? '編集データを読み直す' : 'Refresh editor'}
          </Button>
        </div>
      )}
      {failure && (
        <p role="alert" className="text-destructive">
          {failure.message}
        </p>
      )}
      {failure?.kind === 'uncertain' && (
        <Button type="button" variant="outline" disabled={busy} onClick={check}>
          {ja ? '保存結果を確認' : 'Check saved change'}
        </Button>
      )}
      {failure?.kind === 'conflict' && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                ja
                  ? '下書きを破棄して最新の値を読み込みますか？'
                  : 'Discard this draft and read the latest version?',
              )
            ) {
              if (slug || view) void readLatest()
              else setFailure(undefined)
            }
          }}
        >
          {ja ? '競合を解消' : 'Resolve conflict'}
        </Button>
      )}
      {!view && slug && failure?.kind === 'unavailable' && (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void readLatest()}
        >
          {ja ? '再読み込み' : 'Retry read'}
        </Button>
      )}
      {available && (
        <p role="status">
          {ja ? '公開ページを確認しました。' : 'Available to readers.'}
        </p>
      )}
      {publicState === 'unchecked' && view && (
        <div className="space-y-2">
          <p role="status">
            {ja
              ? '公開ページを確認できませんでした。'
              : 'Public availability could not be verified.'}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const latest = await readPrivateScrap(view.manifest.slug).catch(
                  () => null,
                )
                setPublicState(
                  latest &&
                    isPublicScrap(latest.manifest) &&
                    (await verifiedPublicScrap(latest, locale))
                    ? 'available'
                    : 'unchecked',
                )
              })
            }
          >
            {ja ? '公開ページを確認' : 'Check public page'}
          </Button>
        </div>
      )}
      {canShowCreate && (
        <ScrapLeadForm locale={locale} disabled={blocked} onSave={save} />
      )}
      {view && (
        <>
          {mode.kind !== 'manage' && (
            <Button
              type="button"
              variant="ghost"
              disabled={blocked}
              onClick={() => {
                if (
                  window.confirm(
                    ja
                      ? '管理メニューに戻りますか？'
                      : 'Return to the Scrap controls and discard unsaved changes?',
                  )
                ) {
                  setMode({ kind: 'manage' })
                }
              }}
            >
              {ja ? 'Scrap の管理に戻る' : 'Back to Scrap controls'}
            </Button>
          )}
          {mode.kind === 'manage' && (
            <ScrapControls
              scrap={view}
              locale={locale}
              disabled={blocked}
              onOpen={setMode}
              onSave={save}
            />
          )}
          {mode.kind === 'lead' && (
            <ScrapLeadForm
              key={view.version}
              scrap={view}
              locale={locale}
              startingLanguage={language}
              disabled={blocked}
              onSave={save}
            />
          )}
          {(mode.kind === 'append' || (mode.kind === 'entry' && entry)) && (
            <ScrapEntryForm
              key={`${view.version}/${entry?.meta.id ?? 'append'}`}
              scrap={view}
              entry={entry}
              locale={locale}
              startingLanguage={language}
              disabled={blocked}
              onSave={save}
            />
          )}
          {mode.kind === 'entry' && !entry && (
            <p role="alert">
              {ja
                ? '記録が見つかりません。'
                : 'This entry is no longer available.'}
            </p>
          )}
        </>
      )}
    </div>
  )
}

function ScrapControls({
  scrap,
  locale,
  disabled,
  onOpen,
  onSave,
}: {
  scrap: ScrapWorkspaceView
  locale: string
  disabled: boolean
  onOpen: (mode: ScrapWorkspaceMode) => void
  onSave: (command: ScrapEditorCommand) => void
}) {
  const ja = locale === 'ja'
  const { manifest, version } = scrap
  const target = { slug: manifest.slug, expectedVersion: version }
  return (
    <fieldset className="min-w-0 space-y-4" disabled={disabled}>
      <div>
        <h3 className="font-serif text-lg">{manifest.title}</h3>
        <p className="text-sm text-muted-foreground">
          {manifest.published
            ? ja
              ? '公開'
              : 'Published'
            : ja
              ? '下書き'
              : 'Draft'}{' '}
          · {manifest.status}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpen({ kind: 'lead' })}
        >
          {ja ? 'リード文を編集' : 'Edit lead'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpen({ kind: 'append' })}
        >
          {ja ? '記録を追加' : 'Append entry'}
        </Button>
        {manifest.status !== 'archived' && (
          <Button
            type="button"
            variant={manifest.published ? 'outline' : 'default'}
            onClick={() =>
              onSave({
                ...target,
                kind: 'set-visibility',
                published: !manifest.published,
              })
            }
          >
            {manifest.published
              ? ja
                ? '非公開にする'
                : 'Unpublish'
              : ja
                ? '公開する'
                : 'Publish scrap'}
          </Button>
        )}
        {manifest.status === 'open' ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onSave({ ...target, kind: 'set-status', status: 'closed' })
            }
          >
            {ja ? 'クローズ' : 'Close scrap'}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onSave({ ...target, kind: 'set-status', status: 'open' })
            }
          >
            {ja ? '再開' : 'Reopen scrap'}
          </Button>
        )}
        {manifest.status !== 'archived' && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onSave({ ...target, kind: 'set-status', status: 'archived' })
            }
          >
            {ja ? 'アーカイブ' : 'Archive scrap'}
          </Button>
        )}
      </div>
      {isPublicScrap(manifest) && (
        <Link
          href={buildLocalizedUrl(`/scraps/${manifest.slug}`, locale)}
          className="inline-block text-primary underline"
        >
          {ja ? '公開ページを開く' : 'Open public scrap'}
        </Link>
      )}
      {scrap.entries.length > 0 && (
        <ul className="divide-y border-y">
          {scrap.entries.map((entry, index) => (
            <li
              key={entry.meta.id}
              className="flex min-w-0 items-center justify-between gap-2 py-2"
            >
              <span className="truncate text-sm">
                {entry.documents
                  .find(
                    (document) => document.locale === manifest.primaryLocale,
                  )
                  ?.source.trimStart()
                  .slice(0, 52) || entry.meta.id}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onOpen({ kind: 'entry', id: entry.meta.id })}
              >
                {ja ? `記録 ${index + 1} を編集` : `Edit entry ${index + 1}`}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  )
}
