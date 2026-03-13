'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import type { NoteSourceEntry } from './notes.domain'
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

export function NoteComposerInline() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <div className="flex justify-end">
        <CollapsibleTrigger asChild>
          <Button type="button">{open ? 'Close' : 'Post'}</Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="data-[state=closed]:hidden">
        <div className="space-y-4 rounded-2xl border border-border/60 p-4">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="min-h-32"
            placeholder="What are you thinking about?"
          />

          <div className="flex justify-end gap-2">
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
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
