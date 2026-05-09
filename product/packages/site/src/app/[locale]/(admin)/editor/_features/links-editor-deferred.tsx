'use client'

import { useEffect, useState } from 'react'
import type { MyLink } from '@/features/links/links.domain'
import { LinksEditorClient } from './links-editor-client'
import { Loader2 } from 'lucide-react'

type LinksEditorDeferredProps = {
  locale: string
}

export function LinksEditorDeferred({ locale }: LinksEditorDeferredProps) {
  const [state, setState] = useState<{ entries: MyLink[], version: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/editor/links')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setState({
          entries: data.collection,
          version: data.version
        })
      } catch (_e) {
        setError('Failed to load Link collection')
      }
    }
    load()
  }, [])

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!state) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>

  return (
    <LinksEditorClient
      initialEntries={state.entries}
      expectedVersion={state.version}
      locale={locale}
      labels={{
        add: 'Add link', // Note: These should ideally come from props or a client-side i18n hook
        save: 'Save and revalidate',
        name: 'Display name',
        id: 'Secondary ID',
        url: 'URL',
        shortenUrl: 'Short URL',
        icon: 'Icon name',
        category: 'Category',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove',
        fetchMetadata: 'Fetch Info'
      }}
    />
  )
}
