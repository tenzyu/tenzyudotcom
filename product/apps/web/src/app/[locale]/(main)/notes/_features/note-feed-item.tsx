'use client'

import { MessageCircle } from 'lucide-react'
import { useIntlayer } from 'next-intlayer'
import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { AdminItemMenu } from '@/app/[locale]/(main)/_features/admin/admin-item-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@tenzyu/ui/avatar'
import { Button } from '@tenzyu/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tenzyu/ui/select'
import { Switch } from '@tenzyu/ui/switch'
import { Textarea } from '@tenzyu/ui/textarea'
import { cn } from '@tenzyu/ui'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/app/[locale]/(main)/_features/admin/editor-collection-client'
import {
  compareNotesByCreatedAtDesc,
  createNoteId,
  listAvailableParentNotes,
  reparentChildrenAfterNoteDelete,
  type NoteSourceEntry,
} from './notes.domain'
import { NoteShareButton } from './note-share-button'

const ROOT_PARENT = '__root__'

type NotesAdminState = {
  collection: NoteSourceEntry[]
  version: string
}

type NoteViewItem = {
  id: string
  body: string
  createdAt: string
  depth: number
  externalUrl?: string
  parentId?: string
  hasConnectorAbove: boolean
  hasConnectorBelow: boolean
  sharePath: string
  showBottomBorder: boolean
}

async function loadNotesAdminState() {
  return loadEditorCollection('notes') as Promise<NotesAdminState>
}

function resolveEditableLocaleKey(entry: NoteSourceEntry, locale: string) {
  if (locale === 'en' && entry.body.en.trim()) {
    return 'en'
  }

  return 'ja'
}

function formatParentOptionLabel(entry: NoteSourceEntry, locale: string) {
  const body = (
    locale === 'ja' ? entry.body.ja : entry.body.en || entry.body.ja
  )
    .replace(/\s+/g, ' ')
    .trim()
  const preview = body.slice(0, 36) || entry.id

  return `${new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(entry.createdAt))} · ${preview}`
}

function formatRelativeNoteTime(createdAt: string, locale: string) {
  const createdAtMs = new Date(createdAt).getTime()
  const diffMs = Math.max(0, Date.now() - createdAtMs)
  const hourMs = 60 * 60 * 1000
  const dayMs = 24 * hourMs

  if (diffMs < dayMs) {
    const hoursAgo = Math.max(1, Math.floor(diffMs / hourMs))
    return locale === 'ja' ? `${hoursAgo}時間前` : `${hoursAgo}h ago`
  }

  const daysAgo = Math.max(1, Math.floor(diffMs / dayMs))
  return locale === 'ja' ? `${daysAgo}日前` : `${daysAgo}d ago`
}

export function NoteFeedItem({
  locale,
  note,
  authorName,
  authorHandle,
  variant = 'list',
}: {
  locale: string
  note: NoteViewItem
  authorName: string
  authorHandle: string
  variant?: 'list' | 'detail-focus' | 'detail-thread'
}) {
  const content = useIntlayer('page-notes')
  const text = content.noteFeed
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [draftBody, setDraftBody] = useState(note.body)
  const [draftParentValue, setDraftParentValue] = useState(ROOT_PARENT)
  const [draftPublished, setDraftPublished] = useState(true)
  const [loadedState, setLoadedState] = useState<NotesAdminState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [isReplySaving, setIsReplySaving] = useState(false)

  const isDetailFocus = variant === 'detail-focus'
  const parentOptions = loadedState
    ? [...listAvailableParentNotes(loadedState.collection, note.id)].sort(
        compareNotesByCreatedAtDesc
      )
    : []

  async function loadTargetEntry() {
    const state = await loadNotesAdminState()
    const target = state.collection.find((entry) => entry.id === note.id)

    if (!target) {
      throw new Error('Note not found')
    }

    const localeKey = resolveEditableLocaleKey(target, locale)
    setLoadedState(state)
    setDraftBody(target.body[localeKey])
    setDraftPublished(target.published !== false)
    setDraftParentValue(target.parentId ?? ROOT_PARENT)
  }

  return (
    <article
      className={cn(
        'relative',
        note.showBottomBorder && 'border-b border-border/60',
        'px-4 py-4 sm:px-6'
      )}
    >
      <div className="grid grid-cols-[56px_minmax(0,1fr)] gap-3">
        <div className="relative flex justify-center">
          {note.hasConnectorAbove ? (
            <span
              className="bg-border/70 absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2"
              aria-hidden="true"
            />
          ) : null}
          {note.hasConnectorBelow ? (
            <span
              className="bg-border/70 absolute top-11 -bottom-4 left-1/2 w-px -translate-x-1/2"
              aria-hidden="true"
            />
          ) : null}
          <Avatar className="relative z-10 size-11 border border-border/60">
            <AvatarImage src="/images/ltvgbz.jpg" alt="tenzyu" />
            <AvatarFallback>TN</AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold">{authorName}</span>
            <span className="truncate text-sm text-muted-foreground">
              {authorHandle}
            </span>
            {!isDetailFocus ? (
              <>
                <span className="text-sm text-muted-foreground">·</span>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={note.createdAt}
                  suppressHydrationWarning
                >
                  {formatRelativeNoteTime(note.createdAt, locale)}
                </time>
              </>
            ) : null}
          </div>

          <div className={cn('mt-1', isDetailFocus && 'space-y-3')}>
            <p
              className={cn(
                'whitespace-pre-wrap text-[15px] leading-7',
                isDetailFocus && 'text-[1.65rem] leading-[1.45] tracking-tight'
              )}
            >
              {note.body}
            </p>

            {isDetailFocus ? (
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <time dateTime={note.createdAt}>
                  {new Intl.DateTimeFormat(
                    locale === 'ja' ? 'ja-JP' : 'en-US',
                    {
                      hour: 'numeric',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  ).format(new Date(note.createdAt))}
                </time>
              </div>
            ) : null}

            <div
              className={cn(
                'text-muted-foreground mt-3 flex items-center gap-1'
              )}
            >
              <AdminGate>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hover:text-foreground"
                  aria-label={text.replyAction.value}
                  onClick={() => setIsReplying((current) => !current)}
                >
                  <MessageCircle className="size-4" />
                </Button>
              </AdminGate>

              <NoteShareButton
                locale={locale}
                sharePath={note.sharePath}
                title={note.body}
              />

              <AdminGate>
                <AdminItemMenu
                  icon="horizontal"
                  label="note"
                  onEdit={async () => {
                    try {
                      await loadTargetEntry()
                      setIsEditing(true)
                    } catch {
                      toast.error(text.loadError.value)
                    }
                  }}
                  onDelete={async () => {
                    try {
                      const state = await loadNotesAdminState()
                      const result = await saveEditorCollection(
                        'notes',
                        JSON.stringify(
                          reparentChildrenAfterNoteDelete(
                            state.collection,
                            note.id
                          ),
                          null,
                          2
                        ),
                        state.version
                      )

                      if (!result.ok) {
                        throw new Error(result.error)
                      }

                      toast.success(text.noteDeleted.value)
                      startTransition(() => {
                        router.refresh()
                      })
                    } catch {
                      toast.error(text.deleteError.value)
                    }
                  }}
                />
              </AdminGate>
            </div>
          </div>

          {isReplying ? (
            <div className="bg-muted/30 mt-3 space-y-3 rounded-2xl border border-border/60 p-4">
              <Textarea
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                className="min-h-28"
                placeholder={text.replyPlaceholder.value}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsReplying(false)
                    setReplyBody('')
                  }}
                >
                  {text.cancel.value}
                </Button>
                <Button
                  type="button"
                  disabled={!replyBody.trim() || isReplySaving}
                  onClick={async () => {
                    setIsReplySaving(true)
                    try {
                      const state = await loadNotesAdminState()
                      const nextEntries: NoteSourceEntry[] = [
                        {
                          id: createNoteId(),
                          body: {
                            ja: replyBody.trim(),
                            en: '',
                          },
                          createdAt: new Date().toISOString(),
                          parentId: note.id,
                          published: true,
                        },
                        ...state.collection,
                      ]

                      const result = await saveEditorCollection(
                        'notes',
                        JSON.stringify(nextEntries, null, 2),
                        state.version
                      )

                      if (!result.ok) {
                        throw new Error(result.error)
                      }

                      toast.success(text.notePosted.value)
                      setReplyBody('')
                      setIsReplying(false)
                      startTransition(() => {
                        router.refresh()
                      })
                    } catch {
                      toast.error(text.postError.value)
                    } finally {
                      setIsReplySaving(false)
                    }
                  }}
                >
                  {text.save.value}
                </Button>
              </div>
            </div>
          ) : null}

          {isEditing ? (
            <div className="bg-muted/30 mt-3 space-y-4 rounded-2xl border border-border/60 p-4">
              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border/60">
                      <th className="bg-muted/40 w-28 px-3 py-3 text-left font-medium">
                        {text.body.value}
                      </th>
                      <td className="px-3 py-3">
                        <Textarea
                          value={draftBody}
                          onChange={(event) => setDraftBody(event.target.value)}
                          className="min-h-32"
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-border/60">
                      <th className="bg-muted/40 w-28 px-3 py-3 text-left font-medium">
                        {text.parent.value}
                      </th>
                      <td className="px-3 py-3">
                        <Select
                          value={draftParentValue}
                          onValueChange={(value) => {
                            if (value !== null) {
                              setDraftParentValue(value)
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={text.topLevel.value} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={ROOT_PARENT}>
                              {text.topLevel.value}
                            </SelectItem>
                            {parentOptions.map((entry) => (
                              <SelectItem key={entry.id} value={entry.id}>
                                {formatParentOptionLabel(entry, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-muted/40 w-28 px-3 py-3 text-left font-medium">
                        {text.published.value}
                      </th>
                      <td className="px-3 py-3">
                        <Switch
                          checked={draftPublished}
                          onCheckedChange={setDraftPublished}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  {text.cancel.value}
                </Button>
                <Button
                  type="button"
                  disabled={!loadedState || !draftBody.trim() || isSaving}
                  onClick={async () => {
                    if (!loadedState) {
                      return
                    }

                    setIsSaving(true)
                    try {
                      const nextEntries = loadedState.collection.map(
                        (entry) => {
                          if (entry.id !== note.id) {
                            return entry
                          }

                          const localeKey = resolveEditableLocaleKey(
                            entry,
                            locale
                          )
                          return {
                            ...entry,
                            body: {
                              ...entry.body,
                              [localeKey]: draftBody.trim(),
                            },
                            parentId:
                              draftParentValue === ROOT_PARENT
                                ? undefined
                                : draftParentValue,
                            published: draftPublished,
                          }
                        }
                      )

                      const result = await saveEditorCollection(
                        'notes',
                        JSON.stringify(nextEntries, null, 2),
                        loadedState.version
                      )

                      if (!result.ok) {
                        throw new Error(result.error)
                      }

                      toast.success(text.noteUpdated.value)
                      setIsEditing(false)
                      startTransition(() => {
                        router.refresh()
                      })
                    } catch {
                      toast.error(text.saveError.value)
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                >
                  {text.save.value}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
