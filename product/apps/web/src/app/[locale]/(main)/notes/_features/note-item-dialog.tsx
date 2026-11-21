'use client'

import { useId, useState, type RefObject } from 'react'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { Textarea } from '@tenzyu/ui/textarea'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import { useSavedPage } from '../../_features/admin/admin-gate'
import {
  AdminEditorDialog,
  ItemEditorFeedback,
} from '../../_features/admin/admin-editor-dialog'
import { useItemEditor } from '../../_features/admin/editor-item-client'
import {
  type NoteCommand,
  NoteEditView,
  type NoteFields,
} from './note-command.validation'
import { buildLocalizedNotePath, createNoteId } from './notes.domain'

export type NoteEditorMode = 'create' | 'reply' | 'edit' | 'delete'

export function NoteItemDialog({
  id,
  locale,
  mode,
  focused,
  trigger,
  onClose,
}: {
  id?: string
  locale: string
  mode: NoteEditorMode
  focused?: boolean
  trigger: RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const ja = locale === 'ja'
  const saved = useSavedPage()
  const [identity] = useState(() => ({
    id: createNoteId(),
    createdAt: new Date().toISOString(),
  }))
  const editor = useItemEditor<NoteEditView, NoteCommand>({
    collection: 'notes',
    id: mode === 'edit' || mode === 'delete' ? id : undefined,
    locale,
    viewSchema: NoteEditView,
    onSaved: (command, view) => {
      const next =
        mode === 'delete' ? view.visibleParentId : view.target?.parentId
      const leave =
        focused &&
        (command.kind === 'delete' ||
          (command.kind === 'edit' && !command.published))
      const path = next
        ? buildLocalizedNotePath(locale, next)
        : buildLocalizedUrl('/notes', locale)
      onClose()
      saved(
        ja ? 'Git に保存しました' : 'Saved to Git',
        leave ? path : undefined,
      )
    },
  })
  const { view, latest, pending, failure, needsCheck } = editor
  const titles = ja
    ? {
        create: 'ノートを書く',
        reply: 'ノートに返信',
        edit: 'ノートを編集',
        delete: 'ノートを削除しますか？',
      }
    : {
        create: 'Write note',
        reply: 'Reply to note',
        edit: 'Edit note',
        delete: 'Delete note?',
      }
  const destructive = mode === 'delete'
  const blocked = pending || needsCheck || failure?.kind === 'conflict'

  return (
    <AdminEditorDialog
      title={titles[mode]}
      trigger={trigger}
      pending={pending}
      destructive={destructive}
      description={
        destructive && view?.childCount
          ? ja
            ? `${view.childCount} 件の直接の返信は、元の親または一覧に移動します。`
            : `${view.childCount} direct replies will move to this note's parent or the feed.`
          : destructive
            ? ja
              ? 'ノートを公開ページから削除します。'
              : 'This removes the note from the site.'
            : undefined
      }
      onClose={onClose}
    >
      <ItemEditorFeedback
        locale={locale}
        pending={pending}
        failure={failure}
        needsCheck={needsCheck}
        hasView={!!view}
        retryRead={() => void editor.read(!!view)}
        check={editor.check}
        latest={
          latest && (
            <div className="space-y-2 rounded-md border p-3">
              {latest.target && (
                <p className="whitespace-pre-wrap">
                  {ja
                    ? latest.target.body.ja
                    : latest.target.body.en || latest.target.body.ja}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={editor.useLatest}
              >
                {ja
                  ? '下書きを破棄して最新の値を使う'
                  : 'Discard draft and use latest values'}
              </Button>
            </div>
          )
        }
      />
      {view && !destructive ? (
        <NoteFieldsForm
          key={view.base.version}
          locale={locale}
          view={view}
          locked={pending || needsCheck}
          blocked={blocked}
          parentId={mode === 'reply' ? id : undefined}
          submitLabel={
            mode === 'edit'
              ? ja
                ? '保存'
                : 'Save note'
              : ja
                ? '投稿'
                : 'Post note'
          }
          onCancel={onClose}
          onSubmit={(fields) => {
            if (mode === 'edit' && id)
              editor.submit({ kind: 'edit', id, ...fields })
            else editor.submit({ kind: 'create', ...identity, ...fields })
          }}
        />
      ) : (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            {ja ? 'キャンセル' : 'Cancel'}
          </Button>
          {destructive && view?.target && id && (
            <Button
              type="button"
              variant="destructive"
              disabled={blocked}
              onClick={() => editor.submit({ kind: 'delete', id })}
            >
              {ja ? '削除' : 'Delete'}
            </Button>
          )}
        </div>
      )}
    </AdminEditorDialog>
  )
}

function NoteFieldsForm({
  locale,
  view,
  locked,
  blocked,
  parentId,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  locale: string
  view: NoteEditView
  locked: boolean
  blocked: boolean
  parentId?: string
  submitLabel: string
  onCancel: () => void
  onSubmit: (fields: NoteFields) => void
}) {
  const ja = locale === 'ja'
  const id = useId()
  const [draft, setDraft] = useState<NoteFields>(
    view.target ?? {
      body: { ja: '', en: '' },
      published: true,
      parentId,
    },
  )
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!blocked) onSubmit(draft)
      }}
    >
      <fieldset disabled={locked} className="grid gap-3">
        <label htmlFor={`${id}-ja`} className="grid gap-1.5">
          {ja ? '日本語の本文' : 'Japanese text'}
          <Textarea
            id={`${id}-ja`}
            required
            rows={3}
            lang="ja"
            value={draft.body.ja}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                body: { ...current.body, ja: event.target.value },
              }))
            }
          />
        </label>
        <label htmlFor={`${id}-en`} className="grid gap-1.5">
          {ja ? '英語の本文' : 'English text'}
          <Textarea
            id={`${id}-en`}
            aria-describedby={`${id}-fallback`}
            rows={3}
            lang="en"
            value={draft.body.en}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                body: { ...current.body, en: event.target.value },
              }))
            }
          />
        </label>
        <p
          id={`${id}-fallback`}
          className="-mt-2 text-xs text-muted-foreground"
        >
          {ja
            ? '未入力の場合は日本語を表示します。'
            : 'Leave blank to show the Japanese text on the English page.'}
        </p>
        <label className="grid gap-1.5">
          {ja ? '親ノート' : 'Parent note'}
          <select
            className="min-h-9 min-w-0 rounded-md border bg-background px-2"
            value={draft.parentId ?? ''}
            onChange={(event) =>
              setDraft({ ...draft, parentId: event.target.value || undefined })
            }
          >
            <option value="">{ja ? '親なし' : 'No parent'}</option>
            {view.parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.label}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-url`} className="grid gap-1.5">
          {ja ? '外部リンク' : 'External link'}
          <Input
            id={`${id}-url`}
            type="url"
            value={draft.externalUrl ?? ''}
            onChange={(event) =>
              setDraft({
                ...draft,
                externalUrl: event.target.value || undefined,
              })
            }
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(event) =>
              setDraft({ ...draft, published: event.target.checked })
            }
          />
          {ja ? '公開' : 'Published'}
        </label>
      </fieldset>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={locked}
          onClick={onCancel}
        >
          {ja ? 'キャンセル' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={blocked}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
