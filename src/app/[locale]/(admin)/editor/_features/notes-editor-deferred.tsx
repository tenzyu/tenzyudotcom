'use client'

import { useEffect, useState } from 'react'
import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import { NotesEditorClient } from './notes-editor-client'
import { Loader2 } from 'lucide-react'

type NotesEditorDeferredProps = {
  locale: string
}

export function NotesEditorDeferred({ locale }: NotesEditorDeferredProps) {
  const [state, setState] = useState<{ entries: NoteSourceEntry[], version: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/editor/notes')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setState({
          entries: data.collection,
          version: data.version
        })
      } catch (e) {
        setError('Failed to load Notes collection')
      }
    }
    load()
  }, [])

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!state) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>

  return (
    <NotesEditorClient
      initialEntries={state.entries}
      expectedVersion={state.version}
      locale={locale}
      labels={{
        add: 'Add note',
        save: 'Save and revalidate',
        bodyJa: 'Body (ja)',
        bodyEn: 'Body (en)',
        createdAt: 'Created at (ISO)',
        externalUrl: 'External URL',
        published: 'Published',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove'
      }}
    />
  )
}
