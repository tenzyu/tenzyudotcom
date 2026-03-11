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
import { AdminItemMenu } from '@/features/admin/admin-item-menu'
import {
  loadEditorCollection,
  saveEditorCollection,
} from '@/features/admin/editor-collection-client'

type PuzzleAdminMenuProps = {
  locale: string
  categoryId: PuzzleCategory['id']
  puzzleIndex: number
  label: string
}

type PuzzleDraft = {
  title: string
  primaryUrl: string
  linksText: string
}

function stringifyLinks(links: PuzzleLink[]) {
  return links.map((link) => `${link.platform} ${link.url}`).join('\n')
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

export function PuzzleAdminMenu({
  categoryId,
  puzzleIndex,
  label,
}: PuzzleAdminMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<PuzzleDraft | null>(null)
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
    return data
  }

  async function persist(nextEntries: PuzzleCategory[]) {
    if (!version) {
      return false
    }

    setIsSaving(true)
    const result = await saveEditorCollection(
      'puzzles',
      JSON.stringify(nextEntries, null, 2),
      version,
    )
    setIsSaving(false)

    if (!result.ok) {
      toast.error('Failed to save puzzles.')
      return false
    }

    toast.success('Puzzles updated')
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
            const puzzle = state.collection
              .find((entry) => entry.id === categoryId)
              ?.puzzles[puzzleIndex]

            if (!puzzle) {
              toast.error('Puzzle not found.')
              return
            }

            setDraft({
              title: puzzle.title,
              primaryUrl: puzzle.url ?? '',
              linksText: stringifyLinks(puzzle.links),
            })
            setOpen(true)
          } catch {
            toast.error('Failed to load puzzle.')
          }
        }}
        onDelete={async () => {
          try {
            const state = entries && version ? { collection: entries, version } : await loadState()
            const nextEntries = state.collection.map((entry) =>
              entry.id === categoryId
                ? {
                    ...entry,
                    puzzles: entry.puzzles.filter((_, index) => index !== puzzleIndex),
                  }
                : entry,
            )
            await persist(nextEntries)
          } catch {
            toast.error('Failed to delete puzzle.')
          }
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit puzzle</DialogTitle>
            <DialogDescription>
              Edit one puzzle item and its platform links.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="grid gap-4">
              <Input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, title: event.target.value } : current,
                  )
                }
                placeholder="Title"
              />
              <Input
                value={draft.primaryUrl}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, primaryUrl: event.target.value }
                      : current,
                  )
                }
                placeholder="Primary URL (optional)"
              />
              <Textarea
                value={draft.linksText}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, linksText: event.target.value } : current,
                  )
                }
                className="min-h-40"
                placeholder={'web https://example.com\nswitch https://example.com'}
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!draft?.title.trim() || !entries || isSaving}
              onClick={async () => {
                if (!draft || !entries) {
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
                        puzzles: entry.puzzles.map((puzzle, index) =>
                          index === puzzleIndex ? nextPuzzle : puzzle,
                        ),
                      }
                    : entry,
                )

                if (await persist(nextEntries)) {
                  setOpen(false)
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
