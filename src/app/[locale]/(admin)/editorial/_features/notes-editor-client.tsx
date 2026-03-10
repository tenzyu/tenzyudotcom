'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { saveEditorialCollectionAction } from './actions'
import { moveItem } from './editor-utils'

type NotesEditorClientProps = {
  initialEntries: NoteSourceEntry[]
  expectedVersion: string
  locale: string
  labels: {
    add: string
    save: string
    bodyJa: string
    bodyEn: string
    createdAt: string
    externalUrl: string
    published: string
    moveUp: string
    moveDown: string
    remove: string
  }
}

function createEmptyNote(): NoteSourceEntry {
  return {
    body: { ja: '', en: '' },
    createdAt: new Date().toISOString(),
    published: true,
  }
}

export function NotesEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  labels,
}: NotesEditorClientProps) {
  const [entries, setEntries] = useState<NoteSourceEntry[]>(initialEntries)
  const sourceJson = JSON.stringify(entries, null, 2)

  return (
    <form action={saveEditorialCollectionAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value="notes" />
      <input type="hidden" name="sourceJson" value={sourceJson} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <Button
        type="button"
        variant="outline"
        onClick={() => setEntries((current) => [...current, createEmptyNote()])}
      >
        <Plus />
        {labels.add}
      </Button>

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <Card key={`${entry.createdAt}`}>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{entry.body.ja || 'Note'}</CardTitle>
                  <CardDescription>{entry.createdAt}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    aria-label={labels.moveUp}
                    onClick={() =>
                      setEntries((current) => moveItem(current, index, -1))
                    }
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === entries.length - 1}
                    aria-label={labels.moveDown}
                    onClick={() =>
                      setEntries((current) => moveItem(current, index, 1))
                    }
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={labels.remove}
                    onClick={() =>
                      setEntries((current) =>
                        current.filter(
                          (_, currentIndex) => currentIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm md:col-span-2">
                <label htmlFor={`note-${index}-createdAt`}>
                  {labels.createdAt}
                </label>
                <Input
                  id={`note-${index}-createdAt`}
                  value={entry.createdAt}
                  onChange={(event) => {
                    const value = event.target.value
                    setEntries((current) =>
                      current.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? { ...currentEntry, createdAt: value }
                          : currentEntry,
                      ),
                    )
                  }}
                />
              </div>
              <div className="space-y-2 text-sm md:col-span-2">
                <label htmlFor={`note-${index}-externalUrl`}>
                  {labels.externalUrl}
                </label>
                <Input
                  id={`note-${index}-externalUrl`}
                  value={entry.externalUrl ?? ''}
                  onChange={(event) => {
                    const value = event.target.value
                    setEntries((current) =>
                      current.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? { ...currentEntry, externalUrl: value || undefined }
                          : currentEntry,
                      ),
                    )
                  }}
                />
              </div>
              <div className="space-y-2 text-sm">
                <label htmlFor={`note-${index}-body-ja`}>{labels.bodyJa}</label>
                <Textarea
                  id={`note-${index}-body-ja`}
                  value={entry.body.ja}
                  onChange={(event) => {
                    const value = event.target.value
                    setEntries((current) =>
                      current.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentEntry,
                              body: { ...currentEntry.body, ja: value },
                            }
                          : currentEntry,
                      ),
                    )
                  }}
                />
              </div>
              <div className="space-y-2 text-sm">
                <label htmlFor={`note-${index}-body-en`}>{labels.bodyEn}</label>
                <Textarea
                  id={`note-${index}-body-en`}
                  value={entry.body.en}
                  onChange={(event) => {
                    const value = event.target.value
                    setEntries((current) =>
                      current.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentEntry,
                              body: { ...currentEntry.body, en: value },
                            }
                          : currentEntry,
                      ),
                    )
                  }}
                />
              </div>
              <div className="flex items-center gap-3 text-sm md:col-span-2">
                <Switch
                  id={`note-${index}-published`}
                  checked={entry.published !== false}
                  onCheckedChange={(checked) => {
                    setEntries((current) =>
                      current.map((currentEntry, currentIndex) =>
                        currentIndex === index
                          ? { ...currentEntry, published: checked }
                          : currentEntry,
                      ),
                    )
                  }}
                />
                <label htmlFor={`note-${index}-published`}>
                  {labels.published}
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="submit">{labels.save}</Button>
    </form>
  )
}
