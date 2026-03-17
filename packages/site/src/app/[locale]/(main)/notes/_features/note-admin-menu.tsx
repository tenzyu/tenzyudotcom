'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { NoteSourceEntry } from './notes.domain'
import { AdminItemMenu } from '@/app/[locale]/(main)/_features/admin/admin-item-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/app/[locale]/(main)/_features/admin/editor-collection-client'

type NoteAdminMenuProps = {
  locale: string
  createdAt: string
}

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

export function NoteAdminMenu({
  locale,
  createdAt,
}: NoteAdminMenuProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draftBody, setDraftBody] = useState('')
  const [draftPublished, setDraftPublished] = useState(true)
  const [loadedState, setLoadedState] = useState<NotesAdminState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadTargetEntry() {
    const state = await loadNotesAdminState()
    const target = state.collection.find((entry) => entry.createdAt === createdAt)

    if (!target) {
      throw new Error('Note not found')
    }

    const localeKey = resolveEditableLocaleKey(target, locale)
    setLoadedState(state)
    setDraftBody(target.body[localeKey])
    setDraftPublished(target.published !== false)
  }

  return (
    <>
      <AdminItemMenu
        label="note"
        onEdit={async () => {
          try {
            await loadTargetEntry()
            setDialogOpen(true)
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
                state.collection.filter((entry) => entry.createdAt !== createdAt),
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>
              Update the visible body and published state for this note.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={draftBody}
            onChange={(event) => setDraftBody(event.target.value)}
            className="min-h-48"
          />

          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Published</p>
              <p className="text-muted-foreground text-sm">
                Hide the note from the public list without deleting it.
              </p>
            </div>
            <Switch
              checked={draftPublished}
              onCheckedChange={setDraftPublished}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!loadedState || isSaving}
              onClick={async () => {
                if (!loadedState) {
                  return
                }

                setIsSaving(true)
                try {
                  const nextEntries = loadedState.collection.map((entry) => {
                    if (entry.createdAt !== createdAt) {
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
                  setDialogOpen(false)
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
