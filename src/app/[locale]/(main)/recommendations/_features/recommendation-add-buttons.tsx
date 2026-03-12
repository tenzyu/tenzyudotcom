'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { RecommendationSourceEntry } from '@/features/recommendations/recommendations.domain'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/features/admin/editor-collection-client'

type RecommendationsAdminState = {
  collection: RecommendationSourceEntry[]
  version: string
}

async function loadRecommendationsState() {
  return loadEditorCollection('recommendations') as Promise<RecommendationsAdminState>
}

export function RecommendationAddButtons() {
  const router = useRouter()
  const [mode, setMode] = useState<'video' | 'channel' | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [videoDraft, setVideoDraft] = useState({ sourceUrl: '', note: '' })
  const [channelDraft, setChannelDraft] = useState({
    title: '',
    handle: '',
    url: '',
    note: '',
  })

  return (
    <>
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" onClick={() => setMode('video')}>
          Add video
        </Button>
        <Button type="button" variant="outline" onClick={() => setMode('channel')}>
          Add channel
        </Button>
      </div>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'video' ? 'Add video' : 'Add channel'}</DialogTitle>
            <DialogDescription>
              Create one recommendation item without leaving the page.
            </DialogDescription>
          </DialogHeader>
          {mode === 'video' ? (
            <div className="grid gap-4">
              <Input value={videoDraft.sourceUrl} onChange={(e) => setVideoDraft({ ...videoDraft, sourceUrl: e.target.value })} placeholder="YouTube URL" />
              <Textarea value={videoDraft.note} onChange={(e) => setVideoDraft({ ...videoDraft, note: e.target.value })} className="min-h-40" placeholder="Comment" />
            </div>
          ) : mode === 'channel' ? (
            <div className="grid gap-4">
              <Input value={channelDraft.title} onChange={(e) => setChannelDraft({ ...channelDraft, title: e.target.value })} placeholder="Title" />
              <Input value={channelDraft.handle} onChange={(e) => setChannelDraft({ ...channelDraft, handle: e.target.value })} placeholder="@handle" />
              <Input value={channelDraft.url} onChange={(e) => setChannelDraft({ ...channelDraft, url: e.target.value })} placeholder="Channel URL" />
              <Textarea value={channelDraft.note} onChange={(e) => setChannelDraft({ ...channelDraft, note: e.target.value })} className="min-h-40" placeholder="Comment" />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMode(null)}>Cancel</Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true)
                try {
                  const state = await loadRecommendationsState()
                  const nextEntry: RecommendationSourceEntry =
                    mode === 'video'
                      ? {
                          kind: 'youtube-video',
                          sourceUrl: videoDraft.sourceUrl.trim(),
                          note: { ja: videoDraft.note.trim(), en: '' },
                          published: true,
                        }
                      : {
                          kind: 'youtube-channel',
                          title: channelDraft.title.trim(),
                          handle: channelDraft.handle.trim(),
                          url: channelDraft.url.trim(),
                          note: { ja: channelDraft.note.trim(), en: '' },
                          published: true,
                        }
                  const result = await saveEditorCollection(
                    'recommendations',
                    JSON.stringify([...state.collection, nextEntry], null, 2),
                    state.version,
                  )
                  if (!result.ok) throw new Error(result.error)
                  toast.success('Recommendation added')
                  setMode(null)
                  startTransition(() => {
                    router.refresh()
                  })
                } catch {
                  toast.error('Failed to add recommendation.')
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
