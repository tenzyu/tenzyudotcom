'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { NoteSourceEntry } from './notes.domain'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/features/admin/editor-collection-client'

type NotesAdminState = {
  collection: NoteSourceEntry[]
  version: string
}

async function loadNotesAdminState() {
  return loadEditorCollection('notes') as Promise<NotesAdminState>
}

export function NoteTweetButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Post
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post note</DialogTitle>
            <DialogDescription>
              Publish a quick note with a single body field.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-40"
            placeholder="What are you thinking about?"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!body.trim() || isSaving}
              onClick={async () => {
                setIsSaving(true)
                try {
                  const state = await loadNotesAdminState()
                  const nextEntries: NoteSourceEntry[] = [
                    {
                      body: {
                        ja: body.trim(),
                        en: '',
                      },
                      createdAt: new Date().toISOString(),
                      published: true,
                    },
                    ...state.collection,
                  ]

                  const result = await saveEditorCollection(
                    'notes',
                    JSON.stringify(nextEntries, null, 2),
                    state.version,
                  )

                  if (!result.ok) {
                    throw new Error(result.error)
                  }

                  toast.success('Note posted')
                  setBody('')
                  setOpen(false)
                  startTransition(() => {
                    router.refresh()
                  })
                } catch {
                  toast.error('Failed to post note.')
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
