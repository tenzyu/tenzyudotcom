'use client'

import { useId, useState, type RefObject } from 'react'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import {
  LinkEditView,
  type LinkCommand,
} from '@/features/links/link-command.validation'
import { LINK_CATEGORY_ORDER, type MyLink } from '@/features/links/links.domain'
import { useSavedPage } from '../../_features/admin/admin-gate'
import {
  AdminEditorDialog,
  ItemEditorFeedback,
} from '../../_features/admin/admin-editor-dialog'
import { useItemEditor } from '../../_features/admin/editor-item-client'

export function LinkItemDialog({
  mode,
  locale,
  shortCode,
  trigger,
  onClose,
}: {
  mode: 'create' | 'edit' | 'delete'
  locale: string
  shortCode?: string
  trigger: RefObject<HTMLButtonElement | null>
  onClose: () => void
}) {
  const ja = locale === 'ja'
  const saved = useSavedPage()
  const editor = useItemEditor<LinkEditView, LinkCommand>({
    collection: 'links',
    id: shortCode,
    locale,
    viewSchema: LinkEditView,
    onSaved: () => {
      onClose()
      saved(ja ? 'Git に保存しました' : 'Saved to Git')
    },
  })
  const { view, latest, pending, failure, needsCheck } = editor
  const titles = ja
    ? {
        create: 'リンクを追加',
        edit: 'リンクを編集',
        delete: 'リンクを削除しますか？',
      }
    : { create: 'Add link', edit: 'Edit link', delete: 'Delete link?' }
  const destructive = mode === 'delete'
  const blocked = pending || needsCheck || failure?.kind === 'conflict'

  return (
    <AdminEditorDialog
      title={titles[mode]}
      trigger={trigger}
      pending={pending}
      destructive={destructive}
      description={
        destructive
          ? ja
            ? '短縮 URL も削除します。'
            : 'This removes the short URL.'
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
                <p className="break-words">
                  {latest.target.name} · {latest.target.url}
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
        <LinkFieldsForm
          key={view.base.version}
          view={view}
          locale={locale}
          locked={pending || needsCheck}
          blocked={blocked}
          onCancel={onClose}
          onSubmit={(link, before) => {
            if (shortCode)
              editor.submit({
                kind: 'edit',
                originalShortCode: shortCode,
                link,
                before,
              })
            else editor.submit({ kind: 'create', link, before })
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
          {destructive && view?.target && shortCode && (
            <Button
              type="button"
              variant="destructive"
              disabled={blocked}
              onClick={() =>
                editor.submit({ kind: 'delete', originalShortCode: shortCode })
              }
            >
              {ja ? '削除' : 'Delete'}
            </Button>
          )}
        </div>
      )}
    </AdminEditorDialog>
  )
}

function LinkFieldsForm({
  view,
  locale,
  locked,
  blocked,
  onSubmit,
  onCancel,
}: {
  view: LinkEditView
  locale: string
  locked: boolean
  blocked: boolean
  onSubmit: (link: MyLink, before: string | null) => void
  onCancel: () => void
}) {
  const ja = locale === 'ja'
  const id = useId()
  const [link, setLink] = useState<MyLink>(
    view.target ?? {
      name: '',
      id: '',
      url: '',
      shortenUrl: '',
      icon: '',
      category: 'Social',
    },
  )
  const [before, setBefore] = useState(view.before ?? '')
  const fields = [
    { key: 'name', ja: '表示名', en: 'Name' },
    { key: 'id', ja: '表示 ID', en: 'Display ID' },
    { key: 'url', ja: 'リンク先 URL', en: 'Destination URL' },
    { key: 'shortenUrl', ja: '短縮コード', en: 'Short code' },
    { key: 'icon', ja: 'アイコン名', en: 'Icon name' },
  ] as const
  const changedUrl =
    view.target && link.shortenUrl && view.target.shortenUrl !== link.shortenUrl
  const url = (code: string) =>
    buildLocalizedUrl(`/links/${encodeURIComponent(code)}`, locale)
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!blocked) onSubmit(link, before || null)
      }}
    >
      <fieldset disabled={locked} className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label
            key={field.key}
            htmlFor={`${id}-${field.key}`}
            className={`grid min-w-0 gap-1.5 ${field.key === 'url' ? 'sm:col-span-2' : ''}`}
          >
            {ja ? field.ja : field.en}
            <Input
              id={`${id}-${field.key}`}
              required
              type={field.key === 'url' ? 'url' : 'text'}
              value={link[field.key]}
              onChange={(event) =>
                setLink({ ...link, [field.key]: event.target.value })
              }
            />
          </label>
        ))}
        <label className="grid gap-1.5">
          {ja ? 'カテゴリ' : 'Category'}
          <select
            className="min-h-9 min-w-0 rounded-md border bg-background px-2"
            value={link.category}
            onChange={(event) => {
              const category = LINK_CATEGORY_ORDER.find(
                (value) => value === event.target.value,
              )
              if (category) setLink({ ...link, category })
              setBefore('')
            }}
          >
            {LINK_CATEGORY_ORDER.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5">
          {ja ? '表示順' : 'Position'}
          <select
            className="min-h-9 min-w-0 rounded-md border bg-background px-2"
            value={before}
            onChange={(event) => setBefore(event.target.value)}
          >
            <option value="">
              {ja ? 'カテゴリの末尾' : 'End of category'}
            </option>
            {view.neighbors
              .filter((entry) => entry.category === link.category)
              .map((entry) => (
                <option key={entry.shortenUrl} value={entry.shortenUrl}>
                  {ja ? `${entry.name} の前` : `Before ${entry.name}`}
                </option>
              ))}
          </select>
        </label>
      </fieldset>
      {changedUrl && view.target && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-md border p-3 text-sm">
          <dt>{ja ? '現在' : 'Current URL'}</dt>
          <dd className="break-all">{url(view.target.shortenUrl)}</dd>
          <dt>{ja ? '変更後' : 'New URL'}</dt>
          <dd className="break-all">{url(link.shortenUrl)}</dd>
        </dl>
      )}
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
          {ja ? 'リンクを保存' : 'Save link'}
        </Button>
      </div>
    </form>
  )
}
