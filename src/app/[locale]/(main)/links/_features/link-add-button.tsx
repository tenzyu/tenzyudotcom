'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { MyLink } from '@/features/links/links.domain'
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

async function loadLinksAdminState() {
  return loadEditorCollection('links') as Promise<LinksAdminState>
}

export function LinkAddButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<MyLink>({
    name: '',
    id: '',
    url: '',
    shortenUrl: '',
    icon: '',
    category: 'Social',
  })
  const [isSaving, setIsSaving] = useState(false)

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Add link
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add link</DialogTitle>
            <DialogDescription>
              Create one new link without leaving the page.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" />
            <Input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} placeholder="ID" />
            <Input className="md:col-span-2" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://example.com" />
            <Input value={draft.shortenUrl} onChange={(e) => setDraft({ ...draft, shortenUrl: e.target.value })} placeholder="short-url" />
            <Input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="icon" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving || !draft.name.trim() || !draft.id.trim() || !draft.url.trim() || !draft.shortenUrl.trim() || !draft.icon.trim()}
              onClick={async () => {
                setIsSaving(true)
                try {
                  const state = await loadLinksAdminState()
                  const result = await saveEditorCollection(
                    'links',
                    JSON.stringify([...state.collection, draft], null, 2),
                    state.version,
                  )
                  if (!result.ok) throw new Error(result.error)
                  toast.success('Link added')
                  setOpen(false)
                  startTransition(() => {
                    router.refresh()
                  })
                } catch {
                  toast.error('Failed to add link.')
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
