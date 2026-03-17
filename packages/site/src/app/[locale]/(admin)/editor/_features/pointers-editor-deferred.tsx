'use client'

import { useEffect, useState } from 'react'
import type { DashboardSourceCategory } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.domain'
import { PointersEditorClient } from './pointers-editor-client'
import { Loader2 } from 'lucide-react'

type PointersEditorDeferredProps = {
  locale: string
}

export function PointersEditorDeferred({ locale }: PointersEditorDeferredProps) {
  const [state, setState] = useState<{ entries: DashboardSourceCategory[], version: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/editor/pointers')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setState({
          entries: data.collection,
          version: data.version
        })
      } catch (_e) {
        setError('Failed to load Pointers collection')
      }
    }
    load()
  }, [])

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!state) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>

  return (
    <PointersEditorClient
      initialEntries={state.entries}
      expectedVersion={state.version}
      locale={locale}
      labels={{
        addLink: 'Add link',
        save: 'Save and revalidate',
        categoryTitleJa: 'Category title (ja)',
        categoryTitleEn: 'Category title (en)',
        categoryDescriptionJa: 'Category description (ja)',
        categoryDescriptionEn: 'Category description (en)',
        linkTitleJa: 'Link title (ja)',
        linkTitleEn: 'Link title (en)',
        linkDescriptionJa: 'Link description (ja)',
        linkDescriptionEn: 'Link description (en)',
        linkId: 'Link ID',
        url: 'URL',
        isApp: 'App deep link',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove',
        fetchMetadata: 'Fetch Info'
      }}
    />
  )
}
