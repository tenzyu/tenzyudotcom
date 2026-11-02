'use client'

import { useActionState, useId, useState } from 'react'
import { getLocalizedUrl } from 'intlayer'
import { EditorPanel } from '@tenzyu/ui/editorial'
import { Button } from '@tenzyu/ui/button'
import { Input } from '@tenzyu/ui/input'
import { Textarea } from '@tenzyu/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@tenzyu/ui/select'
import type { ScrapEditorState } from '@/features/content-editor/scrap-editor.assemble'
import type { EditorMutationState } from '@/features/content-editor/scrap-editor.domain'
import {
  CONTENT_LOCALES,
  SCRAP_STATUSES,
  SCRAP_ENTRY_KINDS,
  type ContentLocale,
} from '@/features/scraps/scraps.domain'
import { saveScrapAction } from './scraps.actions'

function ScrapSaveFeedback({
  state,
  locale,
  slug,
}: {
  state: EditorMutationState
  locale: string
  slug: string
}) {
  if (state.status === 'idle') return null
  return (
    <div
      role={state.status === 'error' ? 'alert' : 'status'}
      className="space-y-2"
    >
      <p>{state.message}</p>
      {state.status === 'saved' ? (
        <a href={getLocalizedUrl(`/editor/scraps?slug=${state.slug}`, locale)}>
          Load saved scrap
        </a>
      ) : null}
      {state.status === 'error' &&
      (state.error === 'conflict' || state.error === 'uncertain') ? (
        <a
          href={getLocalizedUrl(
            `/editor/scraps?slug=${encodeURIComponent(slug)}`,
            locale,
          )}
        >
          Load latest scrap after copying your draft
        </a>
      ) : null}
    </div>
  )
}

function useScrapSave(onSaved: () => void) {
  return useActionState(
    async (previous: EditorMutationState, form: FormData) => {
      const result = await saveScrapAction(previous, form)
      if (
        result.status === 'saved' ||
        (result.status === 'error' && result.error === 'uncertain')
      )
        onSaved()
      return result
    },
    { status: 'idle' },
  )
}

function LocalePicker({
  value,
  onChange,
  original,
}: {
  value: ContentLocale
  onChange: (locale: ContentLocale) => void
  original: ContentLocale
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <label htmlFor={id}>Document language</label>
      <input type="hidden" name="locale" value={value} />
      <Select
        value={value}
        onValueChange={(next) => {
          if (next === 'ja' || next === 'en') onChange(next)
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_LOCALES.map((locale) => (
            <SelectItem key={locale} value={locale}>
              {locale === 'ja' ? 'Japanese' : 'English'}
              {locale === original ? ' (original)' : ' (manual translation)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ScrapMetadataForm({
  scrap,
  locale,
  locked,
  onSaved,
}: {
  scrap: ScrapEditorState | null
  locale: string
  locked: boolean
  onSaved: () => void
}) {
  const id = useId()
  const manifest = scrap?.manifest
  const [details, setDetails] = useState({
    slug: manifest?.slug ?? '',
    title: manifest?.title ?? '',
    hypothesis: manifest?.hypothesis ?? '',
    summary: manifest?.summary ?? '',
    tags: manifest?.tags.join(', ') ?? '',
    published: manifest?.published ?? false,
  })
  const [language, setLanguage] = useState<ContentLocale>(
    manifest?.primaryLocale ?? (locale === 'en' ? 'en' : 'ja'),
  )
  const [bodies, setBodies] = useState({
    ja: scrap?.lead.find((ref) => ref.locale === 'ja')?.source ?? '',
    en: scrap?.lead.find((ref) => ref.locale === 'en')?.source ?? '',
  })
  const [state, action, pending] = useScrapSave(onSaved)
  const [status, setStatus] = useState(manifest?.status ?? 'open')
  return (
    <EditorPanel
      title={manifest ? 'Scrap details and lead' : 'Create a scrap'}
      description="Title and metadata are shared across languages. Saving a changed original marks existing translations stale. Translation fields start empty when no translation exists."
    >
      <form action={action} className="space-y-5">
        <input
          type="hidden"
          name="kind"
          value={manifest ? 'update' : 'create'}
        />
        <input type="hidden" name="uiLocale" value={locale} />
        <input
          type="hidden"
          name="expectedVersion"
          value={scrap?.version ?? ''}
        />
        <fieldset disabled={pending || locked} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor={`${id}-slug`}>Slug</label>
            <Input
              id={`${id}-slug`}
              name="slug"
              value={details.slug}
              onChange={(event) =>
                setDetails({ ...details, slug: event.target.value })
              }
              readOnly={!!manifest}
              pattern="[a-z0-9][a-z0-9-]{0,79}"
              placeholder="research-topic"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-title`}>Title</label>
            <Input
              id={`${id}-title`}
              name="title"
              value={details.title}
              onChange={(event) =>
                setDetails({ ...details, title: event.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-hypothesis`}>Question or hypothesis</label>
            <Textarea
              id={`${id}-hypothesis`}
              name="hypothesis"
              value={details.hypothesis}
              onChange={(event) =>
                setDetails({ ...details, hypothesis: event.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-summary`}>Summary</label>
            <Textarea
              id={`${id}-summary`}
              name="summary"
              value={details.summary}
              onChange={(event) =>
                setDetails({ ...details, summary: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-tags`}>Tags, separated by commas</label>
            <Input
              id={`${id}-tags`}
              name="tags"
              value={details.tags}
              onChange={(event) =>
                setDetails({ ...details, tags: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-status`}>Status</label>
            <input type="hidden" name="status" value={status} />
            <Select
              value={status}
              onValueChange={(next) => {
                if (next === 'open' || next === 'closed' || next === 'archived')
                  setStatus(next)
              }}
            >
              <SelectTrigger id={`${id}-status`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRAP_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2">
            <input
              name="published"
              type="checkbox"
              checked={details.published}
              onChange={(event) =>
                setDetails({ ...details, published: event.target.checked })
              }
            />
            Published on the site
          </label>
          <p className="text-sm text-muted-foreground">
            Unpublished and archived scraps are hidden from readers. Closing a
            published scrap keeps it readable.
          </p>
          <LocalePicker
            value={language}
            onChange={setLanguage}
            original={manifest?.primaryLocale ?? language}
          />
          {manifest ? (
            <p className="text-sm">
              Current translation state:{' '}
              {scrap?.lead.find((ref) => ref.locale === language)?.state ??
                'missing'}
            </p>
          ) : (
            <p className="text-sm">
              The selected language becomes the original language.
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor={`${id}-lead`}>Lead, in MDX</label>
            <Textarea
              id={`${id}-lead`}
              name="lead"
              value={bodies[language]}
              onChange={(event) =>
                setBodies({ ...bodies, [language]: event.target.value })
              }
              rows={12}
              required
            />
          </div>
          <Button type="submit">
            {pending
              ? 'Saving…'
              : manifest
                ? 'Save details and lead'
                : 'Create scrap'}
          </Button>
        </fieldset>
        <ScrapSaveFeedback state={state} locale={locale} slug={details.slug} />
      </form>
    </EditorPanel>
  )
}

function ScrapEntryForm({
  scrap,
  entry,
  locale,
  locked,
  onSaved,
  nextEntryId,
}: {
  scrap: ScrapEditorState
  entry?: ScrapEditorState['entries'][number]
  locale: string
  locked: boolean
  onSaved: () => void
  nextEntryId: string
}) {
  const id = useId()
  const [language, setLanguage] = useState<ContentLocale>(
    scrap.manifest.primaryLocale,
  )
  const [bodies, setBodies] = useState({
    ja: entry?.documents.find((ref) => ref.locale === 'ja')?.source ?? '',
    en: entry?.documents.find((ref) => ref.locale === 'en')?.source ?? '',
  })
  const [entryKind, setEntryKind] = useState(entry?.meta.kind ?? 'note')
  const [entryId] = useState(entry?.meta.id ?? nextEntryId)
  const [published, setPublished] = useState(entry?.meta.published ?? false)
  const [state, action, pending] = useScrapSave(onSaved)
  return (
    <EditorPanel
      title={entry ? `Edit entry ${entry.meta.id}` : 'Append an entry'}
      description={
        entry
          ? entry.meta.createdAt
          : 'New entries start in the original language. Save one before adding a translation.'
      }
    >
      <form action={action} className="space-y-5">
        <input
          type="hidden"
          name="kind"
          value={entry ? 'edit-entry' : 'append'}
        />
        <input type="hidden" name="slug" value={scrap.manifest.slug} />
        <input type="hidden" name="entryId" value={entryId} />
        <input type="hidden" name="uiLocale" value={locale} />
        <input type="hidden" name="expectedVersion" value={scrap.version} />
        <fieldset disabled={pending || locked} className="space-y-5">
          {entry ? (
            <LocalePicker
              value={language}
              onChange={setLanguage}
              original={scrap.manifest.primaryLocale}
            />
          ) : (
            <input type="hidden" name="locale" value={language} />
          )}
          <div className="space-y-2">
            <label htmlFor={`${id}-kind`}>Entry kind</label>
            <input type="hidden" name="entryKind" value={entryKind} />
            <Select
              value={entryKind}
              onValueChange={(next) => {
                const found = SCRAP_ENTRY_KINDS.find((kind) => kind === next)
                if (found) setEntryKind(found)
              }}
            >
              <SelectTrigger id={`${id}-kind`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCRAP_ENTRY_KINDS.map((kind) => (
                  <SelectItem key={kind} value={kind}>
                    {kind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {entry ? (
            <p className="text-sm">
              Current translation state:{' '}
              {entry.documents.find((ref) => ref.locale === language)?.state ??
                'missing'}
            </p>
          ) : null}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="published"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />
            Published entry
          </label>
          <div className="space-y-2">
            <label htmlFor={`${id}-body`}>Entry, in MDX</label>
            <Textarea
              id={`${id}-body`}
              name="body"
              value={bodies[language]}
              onChange={(event) =>
                setBodies({ ...bodies, [language]: event.target.value })
              }
              rows={10}
              required
            />
          </div>
          <Button type="submit">
            {pending ? 'Saving…' : entry ? 'Save entry' : 'Append entry'}
          </Button>
        </fieldset>
        <ScrapSaveFeedback
          state={state}
          locale={locale}
          slug={scrap.manifest.slug}
        />
      </form>
    </EditorPanel>
  )
}

export function ScrapEditorWorkspace({
  locale,
  scrap,
  nextEntryId,
}: {
  locale: string
  scrap: ScrapEditorState | null
  nextEntryId: string
}) {
  const [locked, setLocked] = useState(false)
  const onSaved = () => setLocked(true)
  return (
    <div className="space-y-8">
      {locked ? (
        <p role="status">
          Your drafts remain on this page. Copy any other unsaved changes before
          loading the latest version.
        </p>
      ) : null}
      <ScrapMetadataForm
        scrap={scrap}
        locale={locale}
        locked={locked}
        onSaved={onSaved}
      />
      {scrap ? (
        <>
          <ScrapEntryForm
            scrap={scrap}
            locale={locale}
            locked={locked}
            onSaved={onSaved}
            nextEntryId={nextEntryId}
          />
          {scrap.entries.map((entry) => (
            <ScrapEntryForm
              key={entry.meta.id}
              scrap={scrap}
              entry={entry}
              locale={locale}
              locked={locked}
              onSaved={onSaved}
              nextEntryId={nextEntryId}
            />
          ))}
        </>
      ) : null}
    </div>
  )
}
