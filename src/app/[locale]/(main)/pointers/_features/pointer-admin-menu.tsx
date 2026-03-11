'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  DashboardSourceCategory,
  DashboardSourceLink,
} from './dashboard/dashboard.domain'
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
import { AdminItemMenu } from '@/features/admin/admin-item-menu'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/features/admin/editor-collection-client'

type PointerAdminMenuProps = {
  locale: string
  categoryId: string
  linkId: string
  label: string
}

type PointerDraft = {
  id: string
  title: string
  description: string
  url: string
  isApp: boolean
}

function resolveEditableLocaleKey(
  text: { ja: string; en: string },
  locale: string,
) {
  if (locale === 'en' && text.en.trim()) {
    return 'en'
  }

  return 'ja'
}

export function PointerAdminMenu({
  locale,
  categoryId,
  linkId,
  label,
}: PointerAdminMenuProps) {
  const router = useRouter()
  const [draft, setDraft] = useState<PointerDraft | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
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
    return data
  }

  async function persist(nextEntries: DashboardSourceCategory[]) {
    if (!version) {
      return false
    }

    setIsSaving(true)
    const result = await saveEditorCollection(
      'pointers',
      JSON.stringify(nextEntries, null, 2),
      version,
    )
    setIsSaving(false)

    if (!result.ok) {
      toast.error('Failed to save pointers.')
      return false
    }

    setEntries(nextEntries)
    setVersion(result.version)
    toast.success('Pointers updated')
    startTransition(() => {
      router.refresh()
    })
    return true
  }

  return (
    <>
      <AdminItemMenu
        label={label}
        onEdit={async () => {
          try {
            const state = entries && version ? { collection: entries, version } : await loadState()
            const link = state.collection
              .find((entry) => entry.id === categoryId)
              ?.links.find((entry) => entry.id === linkId)

            if (!link) {
              toast.error('Pointer not found.')
              return
            }

            const titleLocale = resolveEditableLocaleKey(link.title, locale)
            const descriptionLocale = resolveEditableLocaleKey(
              link.description,
              locale,
            )

            setDraft({
              id: link.id,
              title: link.title[titleLocale],
              description: link.description[descriptionLocale],
              url: link.url,
              isApp: !!link.isApp,
            })
            setDialogOpen(true)
          } catch {
            toast.error('Failed to load pointer.')
          }
        }}
        onDelete={async () => {
          try {
            const state = entries && version ? { collection: entries, version } : await loadState()
            const nextEntries = state.collection.map((entry) =>
              entry.id === categoryId
                ? {
                    ...entry,
                    links: entry.links.filter((link) => link.id !== linkId),
                  }
                : entry,
            )
            await persist(nextEntries)
          } catch {
            toast.error('Failed to delete pointer.')
          }
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pointer</DialogTitle>
            <DialogDescription>
              Update one pointer item without leaving the page.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="grid gap-4">
              <Input
                value={draft.id}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, id: event.target.value } : current,
                  )
                }
                placeholder="ID"
              />
              <Input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, title: event.target.value } : current,
                  )
                }
                placeholder="Title"
              />
              <Textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, description: event.target.value }
                      : current,
                  )
                }
                className="min-h-32"
                placeholder="Description"
              />
              <Input
                value={draft.url}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, url: event.target.value } : current,
                  )
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
                    setDraft((current) =>
                      current ? { ...current, isApp: checked } : current,
                    )
                  }
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !draft?.id.trim() ||
                !draft.title.trim() ||
                !draft.description.trim() ||
                !draft.url.trim() ||
                !entries ||
                isSaving
              }
              onClick={async () => {
                if (!draft || !entries) {
                  return
                }

                const nextEntries = entries.map((entry) => {
                  if (entry.id !== categoryId) {
                    return entry
                  }

                  const existingLink = entry.links.find((link) => link.id === linkId)
                  if (!existingLink) {
                    return entry
                  }

                  const titleLocale = resolveEditableLocaleKey(existingLink.title, locale)
                  const descriptionLocale = resolveEditableLocaleKey(
                    existingLink.description,
                    locale,
                  )

                  const nextLink: DashboardSourceLink = {
                    id: draft.id,
                    title: {
                      ...existingLink.title,
                      [titleLocale]: draft.title.trim(),
                    },
                    description: {
                      ...existingLink.description,
                      [descriptionLocale]: draft.description.trim(),
                    },
                    url: draft.url.trim(),
                    isApp: draft.isApp || undefined,
                  }

                  return {
                    ...entry,
                    links: entry.links.map((link) =>
                      link.id === linkId ? nextLink : link,
                    ),
                  }
                })

                if (await persist(nextEntries)) {
                  setDialogOpen(false)
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
