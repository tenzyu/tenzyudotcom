'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { NoteSourceEntry } from './notes.domain'
import { AdminItemMenu } from '@/app/[locale]/(main)/_features/admin/admin-item-menu'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/app/[locale]/(main)/_features/admin/editor-collection-client'

type NotesAdminState = {
  collection: NoteSourceEntry[]
  version: string
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

export function NoteFeedItem({
  locale,
  note,
  authorName,
  authorHandle,
}: {
  locale: string
  note: {
    body: string
    createdAt: string
    externalUrl?: string
  }
  authorName: string
  authorHandle: string
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [draftBody, setDraftBody] = useState(note.body)
  const [draftPublished, setDraftPublished] = useState(true)
  const [loadedState, setLoadedState] = useState<NotesAdminState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadTargetEntry() {
    const state = await loadNotesAdminState()
    const target = state.collection.find(
      (entry) => entry.createdAt === note.createdAt,
    )

    if (!target) {
      throw new Error('Note not found')
    }

    const localeKey = resolveEditableLocaleKey(target, locale)
    setLoadedState(state)
    setDraftBody(target.body[localeKey])
    setDraftPublished(target.published !== false)
  }

  return (
    <article className="border-b border-border/50 py-4 last:border-b-0">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <div className="flex flex-col items-center">
          <Avatar className="size-11 border border-border/60">
            <AvatarImage src="/images/ltvgbz.jpg" alt="tenzyu" />
            <AvatarFallback>TN</AvatarFallback>
          </Avatar>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-sm font-semibold">
                  {authorName}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {authorHandle}
                </span>
                <span className="text-sm text-muted-foreground">·</span>
                <time
                  className="text-sm text-muted-foreground"
                  dateTime={note.createdAt}
                >
                  {new Intl.DateTimeFormat(
                    locale === 'ja' ? 'ja-JP' : 'en-US',
                    {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    },
                  ).format(new Date(note.createdAt))}
                </time>
              </div>
            </div>

            <AdminGate>
              <AdminItemMenu
                label="note"
                onEdit={async () => {
                  try {
                    await loadTargetEntry()
                    setIsEditing(true)
                  } catch {
                    toast.error('Failed to load note.')
                  }
                }}
                onDelete={async () => {
                  try {
                    const state = await loadNotesAdminState()
                    const result = await saveEditorCollection(
                      'notes',
                      JSON.stringify(
                        state.collection.filter(
                          (entry) => entry.createdAt !== note.createdAt,
                        ),
                        null,
                        2,
                      ),
                      state.version,
                    )

                    if (!result.ok) {
                      throw new Error(result.error)
                    }

                    toast.success('Note deleted')
                    startTransition(() => {
                      router.refresh()
                    })
                  } catch {
                    toast.error('Failed to delete note.')
                  }
                }}
              />
            </AdminGate>
          </div>

          <p className="text-[15px] leading-7 whitespace-pre-wrap">{note.body}</p>

          {isEditing ? (
            <div className="bg-muted/30 space-y-4 rounded-2xl border border-border/60 p-4">
              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border/60">
                      <th className="bg-muted/40 w-28 px-3 py-3 text-left font-medium">
                        Body
                      </th>
                      <td className="px-3 py-3">
                        <Textarea
                          value={draftBody}
                          onChange={(event) => setDraftBody(event.target.value)}
                          className="min-h-32"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-muted/40 w-28 px-3 py-3 text-left font-medium">
                        Published
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
                  Cancel
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
                      const nextEntries = loadedState.collection.map((entry) => {
                        if (entry.createdAt !== note.createdAt) {
                          return entry
                        }

                        const localeKey = resolveEditableLocaleKey(entry, locale)
                        return {
                          ...entry,
                          body: {
                            ...entry.body,
                            [localeKey]: draftBody.trim(),
                          },
                          published: draftPublished,
                        }
                      })

                      const result = await saveEditorCollection(
                        'notes',
                        JSON.stringify(nextEntries, null, 2),
                        loadedState.version,
                      )

                      if (!result.ok) {
                        throw new Error(result.error)
                      }

                      toast.success('Note updated')
                      setIsEditing(false)
                      startTransition(() => {
                        router.refresh()
                      })
                    } catch {
                      toast.error('Failed to save note.')
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
