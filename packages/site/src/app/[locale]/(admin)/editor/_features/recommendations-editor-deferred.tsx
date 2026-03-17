'use client'

import { useEffect, useState } from 'react'
import type { RecommendationSourceEntry } from '@/features/recommendations/recommendations.domain'
import { RecommendationsEditorClient } from './recommendations-editor-client'
import { Loader2 } from 'lucide-react'

type RecommendationsEditorDeferredProps = {
  locale: string
}

export function RecommendationsEditorDeferred({ locale }: RecommendationsEditorDeferredProps) {
  const [state, setState] = useState<{ entries: RecommendationSourceEntry[], version: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/editor/recommendations')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setState({
          entries: data.collection,
          version: data.version
        })
      } catch (_e) {
        setError('Failed to load Recommendations collection')
      }
    }
    load()
  }, [])

  if (error) return <div className="text-destructive text-sm">{error}</div>
  if (!state) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>

  return (
    <RecommendationsEditorClient
      initialEntries={state.entries}
      expectedVersion={state.version}
      locale={locale}
      labels={{
        addVideo: 'Add video',
        addChannel: 'Add channel',
        save: 'Save and revalidate',
        published: 'Published',
        url: 'URL',
        titleField: 'Channel title',
        handleField: 'Handle',
        noteJa: 'Note (ja)',
        noteEn: 'Note (en)',
        moveUp: 'Move up',
        moveDown: 'Move down',
        remove: 'Remove',
        preview: 'Preview',
        autoFetched: 'Title and views are filled from the YouTube API after save.',
        channelHint: 'Channels still require a manual title and handle for now.',
        videoType: 'YouTube Video',
        channelType: 'YouTube Channel'
      }}
    />
  )
}
