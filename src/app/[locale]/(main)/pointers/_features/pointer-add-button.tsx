'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { DashboardSourceCategory, DashboardSourceLink } from './dashboard/dashboard.domain'
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

type PointerAddButtonProps = {
  locale: string
  categoryId: string
}

type PointerDraft = {
  id: string
  title: string
  description: string
  url: string
  isApp: boolean
}

function createDraft(): PointerDraft {
  return {
    id: '',
    title: '',
    description: '',
    url: '',
    isApp: false,
  }
}

export function PointerAddButton({
  categoryId,
}: PointerAddButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PointerDraft>(createDraft())
  const [entries, setEntries] = useState<DashboardSourceCategory[] | null>(null)
  const [version, setVersion] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadState() {
    const data = (await loadEditorCollection('pointers')) as {
      collection: DashboardSourceCategory[]
      version: string
    }

    setEntries(data.collection)
    setVersion(data.version)
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={async () => {
          try {
            if (!entries || !version) {
              await loadState()
            }
            setOpen(true)
          } catch {
            toast.error('Failed to load pointers.')
          }
        }}
      >
        Add link
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add pointer</DialogTitle>
            <DialogDescription>
              Create one pointer item inside this section.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Input
              value={draft.id}
              onChange={(event) =>
                setDraft((current) => ({ ...current, id: event.target.value }))
              }
              placeholder="ID"
            />
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Title"
            />
            <Textarea
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-32"
              placeholder="Description"
            />
            <Input
              value={draft.url}
              onChange={(event) =>
                setDraft((current) => ({ ...current, url: event.target.value }))
              }
              placeholder="URL"
            />
            <div className="flex items-center justify-between rounded-xl border px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">App link</p>
                <p className="text-muted-foreground text-sm">
                  Enable when this points to a custom scheme instead of http(s).
                </p>
              </div>
              <Switch
                checked={draft.isApp}
                onCheckedChange={(checked) =>
                  setDraft((current) => ({ ...current, isApp: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !draft.id.trim() ||
                !draft.title.trim() ||
                !draft.description.trim() ||
                !draft.url.trim() ||
                !entries ||
                !version ||
                isSaving
              }
              onClick={async () => {
                if (!entries || !version) {
                  return
                }

                const nextLink: DashboardSourceLink = {
                  id: draft.id.trim(),
                  title: {
                    ja: draft.title.trim(),
                    en: '',
                  },
                  description: {
                    ja: draft.description.trim(),
                    en: '',
                  },
                  url: draft.url.trim(),
                  isApp: draft.isApp || undefined,
                }
                const nextEntries = entries.map((entry) =>
                  entry.id === categoryId
                    ? {
                        ...entry,
                        links: [...entry.links, nextLink],
                      }
                    : entry,
                )

                setIsSaving(true)
                const result = await saveEditorCollection(
                  'pointers',
                  JSON.stringify(nextEntries, null, 2),
                  version,
                )
                setIsSaving(false)

                if (!result.ok) {
                  toast.error('Failed to save pointers.')
                  return
                }

                toast.success('Pointers updated')
                setOpen(false)
                setDraft(createDraft())
                startTransition(() => {
                  router.refresh()
                })
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
