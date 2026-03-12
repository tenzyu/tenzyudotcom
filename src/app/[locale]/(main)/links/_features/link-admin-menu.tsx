'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { MyLink } from '@/features/links/links.domain'
import { AdminItemMenu } from '@/app/[locale]/(main)/_features/admin/admin-item-menu'
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
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/app/[locale]/(main)/_features/admin/editor-collection-client'

type LinksAdminState = {
  collection: MyLink[]
  version: string
}

type LinkAdminMenuProps = {
  shortenUrl: string
}

async function loadLinksAdminState() {
  return loadEditorCollection('links') as Promise<LinksAdminState>
}

export function LinkAdminMenu({
  shortenUrl,
}: LinkAdminMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<MyLink | null>(null)
  const [loadedState, setLoadedState] = useState<LinksAdminState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <>
      <AdminItemMenu
        label="link"
        onEdit={async () => {
          try {
            const state = await loadLinksAdminState()
            const target = state.collection.find(
              (entry) => entry.shortenUrl === shortenUrl,
            )
            if (!target) throw new Error('Not found')
            setLoadedState(state)
            setDraft(target)
            setOpen(true)
          } catch {
            toast.error('Failed to load link.')
          }
        }}
        onDelete={async () => {
          try {
            const state = await loadLinksAdminState()
            const result = await saveEditorCollection(
              'links',
              JSON.stringify(
                state.collection.filter((entry) => entry.shortenUrl !== shortenUrl),
                null,
                2,
              ),
              state.version,
            )
            if (!result.ok) throw new Error(result.error)
            toast.success('Link deleted')
            startTransition(() => {
              router.refresh()
            })
          } catch {
            toast.error('Failed to delete link.')
          }
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit link</DialogTitle>
            <DialogDescription>
              Update one link without leaving the page.
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                placeholder="Name"
              />
              <Input
                value={draft.id}
                onChange={(event) =>
                  setDraft({ ...draft, id: event.target.value })
                }
                placeholder="ID"
              />
              <Input
                className="md:col-span-2"
                value={draft.url}
                onChange={(event) =>
                  setDraft({ ...draft, url: event.target.value })
                }
                placeholder="https://example.com"
              />
              <Input
                value={draft.shortenUrl}
                onChange={(event) =>
                  setDraft({ ...draft, shortenUrl: event.target.value })
                }
                placeholder="short-url"
              />
              <Input
                value={draft.icon}
                onChange={(event) =>
                  setDraft({ ...draft, icon: event.target.value })
                }
                placeholder="icon"
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!draft || !loadedState || isSaving}
              onClick={async () => {
                if (!draft || !loadedState) return
                setIsSaving(true)
                try {
                  const result = await saveEditorCollection(
                    'links',
                    JSON.stringify(
                      loadedState.collection.map((entry) =>
                        entry.shortenUrl === shortenUrl ? draft : entry,
                      ),
                      null,
                      2,
                    ),
                    loadedState.version,
                  )
                  if (!result.ok) throw new Error(result.error)
                  toast.success('Link updated')
                  setOpen(false)
                  startTransition(() => {
                    router.refresh()
                  })
                } catch {
                  toast.error('Failed to save link.')
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
