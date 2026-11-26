'use client'

import { useId, useState } from 'react'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { Textarea } from '@tenzyu/ui/textarea'
import {
  CONTENT_LOCALES,
  SCRAP_ENTRY_KINDS,
  type ContentLocale,
} from '@tenzyu/publishing-domain/scraps'
import type { ScrapEditorCommand } from './scrap-editor.validation'
import type { ScrapWorkspaceView } from './scrap-workspace.validation'
import { SourceField } from '@/features/content-editor/source/source-field'

type Document = ScrapWorkspaceView['lead'][number]

function useDocumentDraft(
  documents: Document[],
  startingLanguage: ContentLocale,
  locale: string,
) {
  const [language, setLanguage] = useState(startingLanguage)
  const document = documents.find((item) => item.locale === language)
  const [source, setSource] = useState(document?.source ?? '')
  return {
    document,
    source,
    setSource,
    language,
    switchLanguage(value: string) {
      const next = CONTENT_LOCALES.find((item) => item === value)
      if (!next || next === language) return
      if (
        source !== (document?.source ?? '') &&
        !window.confirm(
          locale === 'ja'
            ? 'この言語の未保存の変更を破棄しますか？'
            : 'Discard unsaved changes in this language?',
        )
      )
        return
      setLanguage(next)
      setSource(documents.find((item) => item.locale === next)?.source ?? '')
    },
  }
}

function LanguageField({
  language,
  original,
  state,
  locale,
  onChange,
}: {
  language: ContentLocale
  original?: ContentLocale
  state?: Document['state']
  locale: string
  onChange: (value: string) => void
}) {
  const ja = locale === 'ja'
  return (
    <div className="space-y-1">
      <label className="flex flex-wrap items-center gap-2">
        {ja ? '本文の言語' : 'Document language'}
        <select
          className="min-h-9 rounded-md border bg-background px-2"
          value={language}
          onChange={(event) => onChange(event.target.value)}
        >
          {CONTENT_LOCALES.map((value) => (
            <option value={value} key={value}>
              {value === 'ja'
                ? ja
                  ? '日本語'
                  : 'Japanese'
                : ja
                  ? '英語'
                  : 'English'}
              {original
                ? value === original
                  ? ja
                    ? '（原文）'
                    : ' (original)'
                  : ja
                    ? '（翻訳）'
                    : ' (translation)'
                : ''}
            </option>
          ))}
        </select>
      </label>
      {original && (
        <p className="text-xs text-muted-foreground">
          {ja ? '翻訳の状態' : 'Translation state'} · {state ?? 'missing'}
        </p>
      )}
    </div>
  )
}

export function ScrapLeadForm({
  scrap,
  locale,
  startingLanguage,
  disabled,
  onSave,
}: {
  scrap?: ScrapWorkspaceView
  locale: string
  startingLanguage?: ContentLocale
  disabled: boolean
  onSave: (command: ScrapEditorCommand) => void
}) {
  const ja = locale === 'ja'
  const manifest = scrap?.manifest
  const id = useId()
  const [fields, setFields] = useState({
    slug: manifest?.slug ?? '',
    title: manifest?.title ?? '',
    hypothesis: manifest?.hypothesis ?? '',
    summary: manifest?.summary ?? '',
    tags: manifest?.tags.join(', ') ?? '',
  })
  const draft = useDocumentDraft(
    scrap?.lead ?? [],
    startingLanguage ?? manifest?.primaryLocale ?? (ja ? 'ja' : 'en'),
    locale,
  )
  const labels = [
    { key: 'slug', title: ja ? 'スラッグ' : 'Slug', required: true },
    { key: 'title', title: ja ? 'タイトル' : 'Title', required: true },
    {
      key: 'hypothesis',
      title: ja ? '問い・仮説' : 'Question or hypothesis',
      required: true,
    },
    { key: 'summary', title: ja ? '要約' : 'Summary', required: false },
    {
      key: 'tags',
      title: ja ? 'タグ（カンマ区切り）' : 'Tags, separated by commas',
      required: false,
    },
  ] as const
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        const values = {
          ...fields,
          locale: draft.language,
          tags: fields.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          lead: draft.source,
        }
        if (scrap) {
          onSave({
            ...values,
            kind: 'update',
            expectedVersion: scrap.version,
            status: scrap.manifest.status,
            published: scrap.manifest.published,
          })
        } else {
          onSave({
            ...values,
            kind: 'create',
            status: 'open',
            published: false,
          })
        }
      }}
    >
      <fieldset disabled={disabled} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {labels.map((field) => {
            const props = {
              id: `${id}-${field.key}`,
              name: field.key,
              required: field.required,
              value: fields[field.key],
              onChange: (
                event: React.ChangeEvent<
                  HTMLInputElement | HTMLTextAreaElement
                >,
              ) => setFields({ ...fields, [field.key]: event.target.value }),
            }
            const multiline =
              field.key === 'hypothesis' || field.key === 'summary'
            return (
              <div
                key={field.key}
                className={`grid gap-1.5 ${multiline ? 'sm:col-span-2' : ''}`}
              >
                <label htmlFor={props.id}>{field.title}</label>
                {multiline ? (
                  <Textarea {...props} rows={2} />
                ) : (
                  <Input
                    {...props}
                    pattern={
                      field.key === 'slug'
                        ? '[a-z0-9][a-z0-9\\-]{0,79}'
                        : undefined
                    }
                    readOnly={field.key === 'slug' && !!manifest}
                  />
                )}
              </div>
            )
          })}
        </div>
        <LanguageField
          language={draft.language}
          state={draft.document?.state}
          original={manifest?.primaryLocale}
          locale={locale}
          onChange={draft.switchLanguage}
        />
        <SourceField
          key={draft.language}
          label={ja ? 'リード文（MDX）' : 'Lead, in MDX'}
          name="lead"
          source={draft.source}
          onChange={draft.setSource}
          kind="scrap"
          locale={locale}
          required
          disabled={disabled}
        />
        <Button type="submit">
          {manifest
            ? ja
              ? '詳細とリード文を保存'
              : 'Save details and lead'
            : ja
              ? '下書きを作成'
              : 'Create draft'}
        </Button>
      </fieldset>
    </form>
  )
}

export function ScrapEntryForm({
  scrap,
  entry,
  locale,
  startingLanguage,
  disabled,
  onSave,
}: {
  scrap: ScrapWorkspaceView
  entry?: ScrapWorkspaceView['entries'][number]
  locale: string
  startingLanguage?: ContentLocale
  disabled: boolean
  onSave: (command: ScrapEditorCommand) => void
}) {
  const ja = locale === 'ja'
  const original = scrap.manifest.primaryLocale
  const draft = useDocumentDraft(
    entry?.documents ?? [],
    entry ? (startingLanguage ?? original) : original,
    locale,
  )
  const [entryId] = useState(
    () => entry?.meta.id ?? `entry-${crypto.randomUUID()}`,
  )
  const [entryKind, setEntryKind] = useState(entry?.meta.kind ?? 'note')
  const [published, setPublished] = useState(entry?.meta.published ?? false)
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          kind: entry ? 'edit-entry' : 'append',
          slug: scrap.manifest.slug,
          expectedVersion: scrap.version,
          locale: draft.language,
          entryId,
          entryKind,
          published,
          body: draft.source,
        })
      }}
    >
      <fieldset className="space-y-4" disabled={disabled}>
        {entry && (
          <LanguageField
            language={draft.language}
            state={draft.document?.state}
            original={original}
            locale={locale}
            onChange={draft.switchLanguage}
          />
        )}
        <label className="flex flex-wrap items-center gap-2">
          {ja ? '記録の種類' : 'Entry kind'}
          <select
            className="min-h-9 rounded-md border bg-background px-2"
            value={entryKind}
            onChange={(event) => {
              const next = SCRAP_ENTRY_KINDS.find(
                (value) => value === event.target.value,
              )
              if (next) setEntryKind(next)
            }}
          >
            {SCRAP_ENTRY_KINDS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(event) => setPublished(event.target.checked)}
          />
          {ja ? '記録を公開' : 'Published entry'}
        </label>
        <SourceField
          key={draft.language}
          label={ja ? '記録（MDX）' : 'Entry, in MDX'}
          name="body"
          source={draft.source}
          onChange={draft.setSource}
          kind="scrap"
          locale={locale}
          required
          disabled={disabled}
        />
        <Button type="submit">
          {entry
            ? ja
              ? '記録を保存'
              : 'Save entry'
            : ja
              ? '記録を追加'
              : 'Append entry'}
        </Button>
      </fieldset>
    </form>
  )
}
