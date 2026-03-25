'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import {
  compareNotesByCreatedAtDesc,
  createNoteId,
  listAvailableParentNotes,
  reparentChildrenAfterNoteDelete,
} from '@/app/[locale]/(main)/notes/_features/notes.domain'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { saveEditorCollectionAction } from './actions'
import { moveItem } from './editor-utils'

const ROOT_PARENT = '__root__'

type NotesEditorClientProps = {
  initialEntries: NoteSourceEntry[]
  expectedVersion: string
  locale: string
  variant?: 'default' | 'inline'
  labels: {
    add: string
    save: string
    id: string
    parent: string
    topLevel: string
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
    id: createNoteId(),
    body: { ja: '', en: '' },
    createdAt: new Date().toISOString(),
    published: true,
  }
}

function formatParentOptionLabel(entry: NoteSourceEntry, locale: string) {
  const body = (locale === 'ja' ? entry.body.ja : entry.body.en || entry.body.ja)
    .replace(/\s+/g, ' ')
    .trim()
  const preview = body.slice(0, 36) || entry.id

  return `${entry.createdAt} · ${preview}`
}

export function NotesEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  variant = 'default',
  labels,
}: NotesEditorClientProps) {
  const [entries, setEntries] = useState<NoteSourceEntry[]>(initialEntries)
  const sourceJson = JSON.stringify(entries, null, 2)
  const titleKey = locale === 'ja' ? 'ja' : 'en'
  const isInline = variant === 'inline'

  return (
    <form action={saveEditorCollectionAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value="notes" />
      <input type="hidden" name="sourceJson" value={sourceJson} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <div
        className={
          isInline
            ? 'bg-background/95 sticky top-3 z-10 flex flex-wrap gap-3 rounded-2xl border p-3 backdrop-blur'
            : 'flex flex-wrap gap-3'
        }
      >
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setEntries((current) => [createEmptyNote(), ...current])
          }
        >
          <Plus />
          {labels.add}
        </Button>
        <Button type="submit">{labels.save}</Button>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const parentOptions = [...listAvailableParentNotes(entries, entry.id)].sort(
            compareNotesByCreatedAtDesc,
          )

          return (
            <Card key={entry.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      {entry.body[titleKey] || entry.body.ja || entry.body.en || 'Note'}
                    </CardTitle>
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
                          reparentChildrenAfterNoteDelete(current, entry.id),
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
                  <label htmlFor={`note-${entry.id}-id`}>{labels.id}</label>
                  <Input id={`note-${entry.id}-id`} value={entry.id} readOnly />
                </div>
                <div className="space-y-2 text-sm md:col-span-2">
                  <label htmlFor={`note-${entry.id}-parent`}>{labels.parent}</label>
                  <Select
                    value={entry.parentId ?? ROOT_PARENT}
                    onValueChange={(value) => {
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentEntry,
                                parentId:
                                  value === ROOT_PARENT ? undefined : value,
                              }
                            : currentEntry,
                        ),
                      )
                    }}
                  >
                    <SelectTrigger
                      id={`note-${entry.id}-parent`}
                      className="w-full"
                    >
                      <SelectValue placeholder={labels.topLevel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ROOT_PARENT}>
                        {labels.topLevel}
                      </SelectItem>
                      {parentOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {formatParentOptionLabel(option, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-sm md:col-span-2">
                  <label htmlFor={`note-${entry.id}-createdAt`}>
                    {labels.createdAt}
                  </label>
                  <Input
                    id={`note-${entry.id}-createdAt`}
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
                  <label htmlFor={`note-${entry.id}-externalUrl`}>
                    {labels.externalUrl}
                  </label>
                  <Input
                    id={`note-${entry.id}-externalUrl`}
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
                  <label htmlFor={`note-${entry.id}-body-ja`}>
                    {labels.bodyJa}
                  </label>
                  <Textarea
                    id={`note-${entry.id}-body-ja`}
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
                  <label htmlFor={`note-${entry.id}-body-en`}>
                    {labels.bodyEn}
                  </label>
                  <Textarea
                    id={`note-${entry.id}-body-en`}
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
                    id={`note-${entry.id}-published`}
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
                  <label htmlFor={`note-${entry.id}-published`}>
                    {labels.published}
                  </label>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isInline ? <Button type="submit">{labels.save}</Button> : null}
    </form>
  )
}
