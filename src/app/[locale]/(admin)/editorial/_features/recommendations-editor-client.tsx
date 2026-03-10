'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type {
  RecommendationSourceChannelEntry,
  RecommendationSourceEntry,
  RecommendationSourceVideoEntry,
} from '@/app/[locale]/(main)/recommendations/_features/recommendations.domain'
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

type RecommendationPreview = {
  title: string
  secondary?: string
}

type RecommendationEditorRow = {
  id: string
  entry: RecommendationSourceEntry
  preview?: RecommendationPreview
}

type RecommendationsEditorClientProps = {
  initialEntries: RecommendationSourceEntry[]
  expectedVersion: string
  locale: string
  previews: RecommendationPreview[]
  labels: {
    addVideo: string
    addChannel: string
    save: string
    published: string
    url: string
    titleField: string
    handleField: string
    noteJa: string
    noteEn: string
    moveUp: string
    moveDown: string
    remove: string
    preview: string
    autoFetched: string
    channelHint: string
    videoType: string
    channelType: string
  }
}

function createEmptyVideo(): RecommendationSourceVideoEntry {
  return {
    kind: 'youtube-video',
    sourceUrl: '',
    note: {
      ja: '',
      en: '',
    },
    published: true,
  }
}

function createEmptyChannel(): RecommendationSourceChannelEntry {
  return {
    kind: 'youtube-channel',
    title: '',
    handle: '',
    url: '',
    note: {
      ja: '',
      en: '',
    },
    published: true,
  }
}

function buildInitialRows(
  initialEntries: RecommendationSourceEntry[],
  previews: RecommendationPreview[],
): RecommendationEditorRow[] {
  return initialEntries.map((entry, index) => ({
    id: `recommendation-row-${index}`,
    entry,
    preview: previews[index],
  }))
}

export function RecommendationsEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  previews,
  labels,
}: RecommendationsEditorClientProps) {
  const [rows, setRows] = useState<RecommendationEditorRow[]>(() =>
    buildInitialRows(initialEntries, previews),
  )
  const nextRowIdRef = useRef(initialEntries.length)

  const sourceJson = JSON.stringify(
    rows.map((row) => row.entry),
    null,
    2,
  )

  return (
    <form action={saveEditorialCollectionAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value="recommendations" />
      <input type="hidden" name="sourceJson" value={sourceJson} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRows((current) => [
              ...current,
              {
                id: `recommendation-row-${nextRowIdRef.current++}`,
                entry: createEmptyVideo(),
              },
            ])
          }}
        >
          <Plus />
          {labels.addVideo}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setRows((current) => [
              ...current,
              {
                id: `recommendation-row-${nextRowIdRef.current++}`,
                entry: createEmptyChannel(),
              },
            ])
          }}
        >
          <Plus />
          {labels.addChannel}
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => {
          const { entry, preview } = row
          const channelPreview =
            entry.kind === 'youtube-channel'
              ? [entry.title, entry.handle].filter(Boolean).join(' / ')
              : undefined
          const urlId = `recommendation-${index}-url`
          const titleId = `recommendation-${index}-title`
          const handleId = `recommendation-${index}-handle`
          const noteJaId = `recommendation-${index}-note-ja`
          const noteEnId = `recommendation-${index}-note-en`
          const publishedId = `recommendation-${index}-published`

          return (
            <Card key={row.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>
                      {entry.kind === 'youtube-video'
                        ? labels.videoType
                        : labels.channelType}
                    </CardTitle>
                    <CardDescription>
                      {entry.kind === 'youtube-channel' && channelPreview
                        ? `${labels.preview}: ${channelPreview}`
                        : preview
                          ? `${labels.preview}: ${preview.title}${preview.secondary ? ` / ${preview.secondary}` : ''}`
                          : entry.kind === 'youtube-video'
                            ? labels.autoFetched
                            : labels.channelHint}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setRows((current) => moveItem(current, index, -1))
                      }}
                      disabled={index === 0}
                      aria-label={labels.moveUp}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setRows((current) => moveItem(current, index, 1))
                      }}
                      disabled={index === rows.length - 1}
                      aria-label={labels.moveDown}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setRows((current) =>
                          current.filter(
                            (_, currentIndex) => currentIndex !== index,
                          ),
                        )
                      }}
                      aria-label={labels.remove}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {entry.kind === 'youtube-video' ? (
                  <div className="space-y-2 text-sm">
                    <label htmlFor={urlId}>{labels.url}</label>
                    <Input
                      id={urlId}
                      value={entry.sourceUrl}
                      onChange={(event) => {
                        const value = event.target.value
                        setRows((current) =>
                          current.map((currentRow, currentIndex) =>
                            currentIndex === index &&
                            currentRow.entry.kind === 'youtube-video'
                              ? {
                                  ...currentRow,
                                  entry: {
                                    ...currentRow.entry,
                                    sourceUrl: value,
                                  },
                                  preview: undefined,
                                }
                              : currentRow,
                          ),
                        )
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <label htmlFor={titleId}>{labels.titleField}</label>
                      <Input
                        id={titleId}
                        value={entry.title}
                        onChange={(event) => {
                          const value = event.target.value
                          setRows((current) =>
                            current.map((currentRow, currentIndex) =>
                              currentIndex === index &&
                              currentRow.entry.kind === 'youtube-channel'
                                ? {
                                    ...currentRow,
                                    entry: {
                                      ...currentRow.entry,
                                      title: value,
                                    },
                                  }
                                : currentRow,
                            ),
                          )
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <label htmlFor={handleId}>{labels.handleField}</label>
                      <Input
                        id={handleId}
                        value={entry.handle}
                        onChange={(event) => {
                          const value = event.target.value
                          setRows((current) =>
                            current.map((currentRow, currentIndex) =>
                              currentIndex === index &&
                              currentRow.entry.kind === 'youtube-channel'
                                ? {
                                    ...currentRow,
                                    entry: {
                                      ...currentRow.entry,
                                      handle: value,
                                    },
                                  }
                                : currentRow,
                            ),
                          )
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <label htmlFor={urlId}>{labels.url}</label>
                      <Input
                        id={urlId}
                        value={entry.url}
                        onChange={(event) => {
                          const value = event.target.value
                          setRows((current) =>
                            current.map((currentRow, currentIndex) =>
                              currentIndex === index &&
                              currentRow.entry.kind === 'youtube-channel'
                                ? {
                                    ...currentRow,
                                    entry: {
                                      ...currentRow.entry,
                                      url: value,
                                    },
                                  }
                                : currentRow,
                            ),
                          )
                        }}
                      />
                    </div>
                  </>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <label htmlFor={noteJaId}>{labels.noteJa}</label>
                    <Textarea
                      id={noteJaId}
                      value={entry.note.ja}
                      onChange={(event) => {
                        const value = event.target.value
                        setRows((current) =>
                          current.map((currentRow, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentRow,
                                  entry: {
                                    ...currentRow.entry,
                                    note: {
                                      ...currentRow.entry.note,
                                      ja: value,
                                    },
                                  },
                                }
                              : currentRow,
                          ),
                        )
                      }}
                    />
                  </div>
                  <div className="space-y-2 text-sm">
                    <label htmlFor={noteEnId}>{labels.noteEn}</label>
                    <Textarea
                      id={noteEnId}
                      value={entry.note.en}
                      onChange={(event) => {
                        const value = event.target.value
                        setRows((current) =>
                          current.map((currentRow, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentRow,
                                  entry: {
                                    ...currentRow.entry,
                                    note: {
                                      ...currentRow.entry.note,
                                      en: value,
                                    },
                                  },
                                }
                              : currentRow,
                          ),
                        )
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Switch
                    id={publishedId}
                    checked={entry.published !== false}
                    onCheckedChange={(checked) => {
                      setRows((current) =>
                        current.map((currentRow, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentRow,
                                entry: {
                                  ...currentRow.entry,
                                  published: checked,
                                },
                              }
                            : currentRow,
                        ),
                      )
                    }}
                  />
                  <label htmlFor={publishedId}>{labels.published}</label>
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
