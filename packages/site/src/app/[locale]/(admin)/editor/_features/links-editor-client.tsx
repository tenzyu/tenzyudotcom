'use client'

import { ArrowDown, ArrowUp, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { LinkCategory, MyLink } from '@/features/links/links.domain'
import { saveEditorCollectionAction } from './actions'
import { moveItem } from './editor-utils'
import { fetchUrlMetadataAction } from './metadata.actions'

type LinksEditorClientProps = {
  initialEntries: MyLink[]
  expectedVersion: string
  locale: string
  labels: {
    add: string
    save: string
    name: string
    id: string
    url: string
    shortenUrl: string
    icon: string
    category: string
    moveUp: string
    moveDown: string
    remove: string
    fetchMetadata: string
  }
}

const LINK_CATEGORIES: LinkCategory[] = ['Watch', 'Social', 'Build', 'Legacy']

function createEmptyLink(): MyLink {
  return {
    name: '',
    id: '',
    url: '',
    shortenUrl: '',
    icon: '',
    category: 'Social',
  }
}

export function LinksEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  labels,
}: LinksEditorClientProps) {
  const [entries, setEntries] = useState<MyLink[]>(initialEntries)
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null)
  const sourceJson = JSON.stringify(entries, null, 2)

  const handleFetchMetadata = async (index: number) => {
    const entry = entries[index]
    if (!entry || !entry.url) return

    setLoadingIndex(index)
    const metadata = await fetchUrlMetadataAction(entry.url)
    setLoadingIndex(null)

    if ('error' in metadata) {
      alert(metadata.error)
      return
    }

    setEntries((current) =>
      current.map((e, i) =>
        i === index
          ? {
              ...e,
              name: e.name || metadata.title || '',
            }
          : e,
      ),
    )
  }

  return (
    <form action={saveEditorCollectionAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value="links" />
      <input type="hidden" name="sourceJson" value={sourceJson} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setEntries((current) => [...current, createEmptyLink()])
        }}
      >
        <Plus />
        {labels.add}
      </Button>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const baseId = `link-${index}`
          return (
            <Card key={`${entry.shortenUrl || 'new'}`}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{entry.name || 'Link'}</CardTitle>
                    <CardDescription>
                      {entry.url || 'https://example.com'}
                    </CardDescription>
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
                <div className="space-y-2 text-sm">
                  <label htmlFor={`${baseId}-name`}>{labels.name}</label>
                  <Input
                    id={`${baseId}-name`}
                    value={entry.name}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? { ...currentEntry, name: value }
                            : currentEntry,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`${baseId}-id`}>{labels.id}</label>
                  <Input
                    id={`${baseId}-id`}
                    value={entry.id}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? { ...currentEntry, id: value }
                            : currentEntry,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm md:col-span-2">
                  <label htmlFor={`${baseId}-url`}>{labels.url}</label>
                  <div className="flex gap-2">
                    <Input
                      id={`${baseId}-url`}
                      value={entry.url}
                      placeholder="https://example.com"
                      onChange={(event) => {
                        const value = event.target.value
                        setEntries((current) =>
                          current.map((currentEntry, currentIndex) =>
                            currentIndex === index
                              ? { ...currentEntry, url: value }
                              : currentEntry,
                          ),
                        )
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Fetch info from URL"
                      disabled={loadingIndex === index || !entry.url}
                      onClick={() => handleFetchMetadata(index)}
                    >
                      {loadingIndex === index ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`${baseId}-shortenUrl`}>
                    {labels.shortenUrl}
                  </label>
                  <Input
                    id={`${baseId}-shortenUrl`}
                    value={entry.shortenUrl}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? { ...currentEntry, shortenUrl: value }
                            : currentEntry,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`${baseId}-icon`}>{labels.icon}</label>
                  <Input
                    id={`${baseId}-icon`}
                    value={entry.icon}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? { ...currentEntry, icon: value }
                            : currentEntry,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`${baseId}-category`}>
                    {labels.category}
                  </label>
                  <select
                    id={`${baseId}-category`}
                    className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                    value={entry.category}
                    onChange={(event) => {
                      const value = event.target.value as LinkCategory
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? { ...currentEntry, category: value }
                            : currentEntry,
                        ),
                      )
                    }}
                  >
                    {LINK_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button type="submit">{labels.save}</Button>
    </form>
  )
}
