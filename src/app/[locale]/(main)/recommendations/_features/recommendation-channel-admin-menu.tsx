'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { RecommendationSourceChannelEntry, RecommendationSourceEntry } from './recommendations.domain'
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
import { Input } from '@/components/ui/input'
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
  if (locale === 'en' && text.en.trim()) return 'en'
  return 'ja'
}

export function RecommendationChannelAdminMenu({
  locale,
  url,
  label,
}: {
  locale: string
  url: string
  label: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<RecommendationsAdminState | null>(null)
  const [draft, setDraft] = useState({
    title: '',
    handle: '',
    url: '',
    note: '',
    published: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  return (
    <>
      <AdminItemMenu
        label={label}
        onEdit={async () => {
          try {
            const nextState = await loadRecommendationsState()
            const sourceIndex = nextState.collection.findIndex(
              (entry) => entry.kind === 'youtube-channel' && entry.url === url,
            )
            const target = nextState.collection[sourceIndex]
            if (sourceIndex === -1 || !target || target.kind !== 'youtube-channel') throw new Error('Not found')
            const localeKey = resolveLocaleKey(target.note, locale)
            setState(nextState)
            setDraft({
              title: target.title,
              handle: target.handle,
              url: target.url,
              note: target.note[localeKey],
              published: target.published !== false,
            })
            setOpen(true)
          } catch {
            toast.error('Failed to load channel.')
          }
        }}
        onDelete={async () => {
          try {
            const nextState = await loadRecommendationsState()
            const sourceIndex = nextState.collection.findIndex(
              (entry) => entry.kind === 'youtube-channel' && entry.url === url,
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
            toast.success('Channel deleted')
            startTransition(() => {
              router.refresh()
            })
          } catch {
            toast.error('Failed to delete channel.')
          }
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit channel</DialogTitle>
            <DialogDescription>
              Update the visible channel fields and published state.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" />
            <Input value={draft.handle} onChange={(e) => setDraft({ ...draft, handle: e.target.value })} placeholder="@handle" />
            <Input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="Channel URL" />
            <Textarea value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="min-h-40" />
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Published</p>
                <p className="text-muted-foreground text-sm">Hide the channel without deleting it.</p>
              </div>
              <Switch checked={draft.published} onCheckedChange={(checked) => setDraft({ ...draft, published: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={!state || isSaving}
              onClick={async () => {
                if (!state) return
                setIsSaving(true)
                try {
                  const sourceIndex = state.collection.findIndex(
                    (entry) => entry.kind === 'youtube-channel' && entry.url === url,
                  )
                  const existing = state.collection[sourceIndex] as RecommendationSourceChannelEntry
                  const localeKey = resolveLocaleKey(existing.note, locale)
                  const nextEntries = state.collection.map((entry, index) =>
                    index === sourceIndex && entry.kind === 'youtube-channel'
                      ? {
                          ...entry,
                          title: draft.title.trim(),
                          handle: draft.handle.trim(),
                          url: draft.url.trim(),
                          note: {
                            ...existing.note,
                            [localeKey]: draft.note.trim(),
                          },
                          published: draft.published,
                        }
                      : entry,
                  )
                  const result = await saveEditorCollection(
                    'recommendations',
                    JSON.stringify(nextEntries, null, 2),
                    state.version,
                  )
                  if (!result.ok) throw new Error(result.error)
                  toast.success('Channel updated')
                  setOpen(false)
                  startTransition(() => {
                    router.refresh()
                  })
                } catch {
                  toast.error('Failed to save channel.')
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
