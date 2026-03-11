'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { PuzzleCategory, PuzzleLink } from './puzzles.domain'
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
import { Textarea } from '@/components/ui/textarea'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/features/admin/editor-collection-client'

type PuzzleAddButtonProps = {
  locale: string
  categoryId: PuzzleCategory['id']
}

type PuzzleDraft = {
  title: string
  primaryUrl: string
  linksText: string
}

function createDraft(): PuzzleDraft {
  return {
    title: '',
    primaryUrl: '',
    linksText: '',
  }
}

function parseLinks(linksText: string, primaryUrl: string): PuzzleLink[] {
  const lines = linksText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0 && primaryUrl.trim()) {
    return [{ platform: 'web', url: primaryUrl.trim() }]
  }

  return lines.map((line) => {
    const [platform, ...urlParts] = line.split(/\s+/)
    return {
      platform: (platform || 'web') as PuzzleLink['platform'],
      url: urlParts.join(' '),
    }
  })
}

export function PuzzleAddButton({
  categoryId,
}: PuzzleAddButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PuzzleDraft>(createDraft())
  const [entries, setEntries] = useState<PuzzleCategory[] | null>(null)
  const [version, setVersion] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadState() {
    const data = (await loadEditorCollection('puzzles')) as {
      collection: PuzzleCategory[]
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
            toast.error('Failed to load puzzles.')
          }
        }}
      >
        Add puzzle
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add puzzle</DialogTitle>
            <DialogDescription>
              Create one puzzle item inside this section.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Input
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="Title"
            />
            <Input
              value={draft.primaryUrl}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  primaryUrl: event.target.value,
                }))
              }
              placeholder="Primary URL (optional)"
            />
            <Textarea
              value={draft.linksText}
              onChange={(event) =>
                setDraft((current) => ({ ...current, linksText: event.target.value }))
              }
              className="min-h-40"
              placeholder={'web https://example.com\nswitch https://example.com'}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!draft.title.trim() || !entries || !version || isSaving}
              onClick={async () => {
                if (!entries || !version) {
                  return
                }

                const nextPuzzle = {
                  title: draft.title.trim(),
                  url: draft.primaryUrl.trim() || undefined,
                  links: parseLinks(draft.linksText, draft.primaryUrl),
                }
                const nextEntries = entries.map((entry) =>
                  entry.id === categoryId
                    ? {
                        ...entry,
                        puzzles: [...entry.puzzles, nextPuzzle],
                      }
                    : entry,
                )

                setIsSaving(true)
                const result = await saveEditorCollection(
                  'puzzles',
                  JSON.stringify(nextEntries, null, 2),
                  version,
                )
                setIsSaving(false)

                if (!result.ok) {
                  toast.error('Failed to save puzzles.')
                  return
                }

                toast.success('Puzzles updated')
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
