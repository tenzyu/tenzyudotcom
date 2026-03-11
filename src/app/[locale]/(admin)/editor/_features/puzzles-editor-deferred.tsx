'use client'

import { useEffect, useState } from 'react'
import type { PuzzleCategory } from '@/app/[locale]/(main)/puzzles/_features/puzzles.domain'
import { PuzzlesEditorClient } from './puzzles-editor-client'
import { Loader2 } from 'lucide-react'

type PuzzlesEditorDeferredProps = {
  locale: string
}

export function PuzzlesEditorDeferred({ locale }: PuzzlesEditorDeferredProps) {
  const [state, setState] = useState<{ entries: PuzzleCategory[], version: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/editor/puzzles')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setState({
          entries: data.collection,
          version: data.version
        })
      } catch (e) {
        setError('Failed to load Puzzles collection')
      }
    }
    load()
  }, [])

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!state) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>

  return (
    <PuzzlesEditorClient
      initialEntries={state.entries}
      expectedVersion={state.version}
      locale={locale}
      labels={{
        addPuzzle: 'Add puzzle',
        addLink: 'Add link',
        save: 'Save and revalidate',
        title: 'Title',
        primaryUrl: 'Primary URL',
        linkUrl: 'Link URL',
        platform: 'Platform',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove'
      }}
    />
  )
}
