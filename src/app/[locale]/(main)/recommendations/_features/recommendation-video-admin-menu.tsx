'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  RecommendationSourceEntry,
  RecommendationSourceVideoEntry,
} from '@/features/recommendations/recommendations.domain'
import { normalizeRecommendationVideoSource } from '@/features/recommendations/recommendation-source.domain'
import { AdminItemMenu } from '@/features/admin/admin-item-menu'
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
} from '@/features/admin/editor-collection-client'

type RecommendationsAdminState = {
  collection: RecommendationSourceEntry[]
  version: string
}

async function loadRecommendationsState() {
  return loadEditorCollection('recommendations') as Promise<RecommendationsAdminState>
}

function resolveLocaleKey(
  text: { ja: string; en: string },
  locale: string,
) {
  if (locale === 'en' && text.en.trim()) {
    return 'en'
  }
  return 'ja'
}

export function RecommendationVideoAdminMenu({
  locale,
  videoId,
  label,
}: {
  locale: string
  videoId: string
  label: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<RecommendationsAdminState | null>(null)
  const [draftNote, setDraftNote] = useState('')
  const [draftPublished, setDraftPublished] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <>
      <AdminItemMenu
        label={label}
        onEdit={async () => {
          try {
            const nextState = await loadRecommendationsState()
            const sourceIndex = nextState.collection.findIndex(
              (entry) =>
                entry.kind === 'youtube-video' &&
                normalizeRecommendationVideoSource(
                  entry.sourceUrl,
                  `recommendation video source (${entry.sourceUrl})`,
                ) === videoId,
            )
            const target = nextState.collection[sourceIndex]
            if (sourceIndex === -1 || !target || target.kind !== 'youtube-video') throw new Error('Not found')
            const localeKey = resolveLocaleKey(target.note, locale)
            setState(nextState)
            setDraftNote(target.note[localeKey])
            setDraftPublished(target.published !== false)
            setOpen(true)
          } catch {
            toast.error('Failed to load video.')
          }
        }}
        onDelete={async () => {
          try {
            const nextState = await loadRecommendationsState()
            const sourceIndex = nextState.collection.findIndex(
              (entry) =>
                entry.kind === 'youtube-video' &&
                normalizeRecommendationVideoSource(
                  entry.sourceUrl,
                  `recommendation video source (${entry.sourceUrl})`,
                ) === videoId,
            )
            const result = await saveEditorCollection(
              'recommendations',
              JSON.stringify(
                nextState.collection.filter((_, index) => index !== sourceIndex),
                null,
                2,
              ),
              nextState.version,
            )
            if (!result.ok) throw new Error(result.error)
            toast.success('Video deleted')
            startTransition(() => {
              router.refresh()
            })
          } catch {
            toast.error('Failed to delete video.')
          }
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit video</DialogTitle>
            <DialogDescription>
              Update the comment and published state for this video.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
            className="min-h-40"
          />
          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Published</p>
              <p className="text-muted-foreground text-sm">
                Hide the video from the public list without deleting it.
              </p>
            </div>
            <Switch checked={draftPublished} onCheckedChange={setDraftPublished} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!state || isSaving}
              onClick={async () => {
                if (!state) return
                setIsSaving(true)
                try {
                  const sourceIndex = state.collection.findIndex(
                    (entry) =>
                      entry.kind === 'youtube-video' &&
                      normalizeRecommendationVideoSource(
                        entry.sourceUrl,
                        `recommendation video source (${entry.sourceUrl})`,
                      ) === videoId,
                  )
                  const existing = state.collection[sourceIndex] as RecommendationSourceVideoEntry
                  const localeKey = resolveLocaleKey(existing.note, locale)
                  const nextEntries = state.collection.map((entry, index) =>
                    index === sourceIndex && entry.kind === 'youtube-video'
                      ? {
                          ...entry,
                          note: {
                            ...existing.note,
                            [localeKey]: draftNote.trim(),
                          },
                          published: draftPublished,
                        }
                      : entry,
                  )
                  const result = await saveEditorCollection(
                    'recommendations',
                    JSON.stringify(nextEntries, null, 2),
                    state.version,
                  )
                  if (!result.ok) throw new Error(result.error)
                  toast.success('Video updated')
                  setOpen(false)
                  startTransition(() => {
                    router.refresh()
                  })
                } catch {
                  toast.error('Failed to save video.')
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
