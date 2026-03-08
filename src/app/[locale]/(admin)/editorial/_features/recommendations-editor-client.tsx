'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type {
  RecommendationSourceChannelEntry,
  RecommendationSourceEntry,
  RecommendationSourceVideoEntry,
} from '@/app/[locale]/(main)/recommendations/_features/recommendations.source'
import { saveEditorialCollectionAction } from './actions'
import { moveItem } from './editor-utils'

type RecommendationPreview = {
  title: string
  secondary?: string
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

export function RecommendationsEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  previews,
  labels,
}: RecommendationsEditorClientProps) {
  const [entries, setEntries] = useState<RecommendationSourceEntry[]>(initialEntries)

  const sourceJson = JSON.stringify(entries, null, 2)

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
            setEntries((current) => [...current, createEmptyVideo()])
          }}
        >
          <Plus />
          {labels.addVideo}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setEntries((current) => [...current, createEmptyChannel()])
          }}
        >
          <Plus />
          {labels.addChannel}
        </Button>
      </div>

      <div className="space-y-4">
        {entries.map((entry, index) => {
          const preview = previews[index]
          const urlId = `recommendation-${index}-url`
          const titleId = `recommendation-${index}-title`
          const handleId = `recommendation-${index}-handle`
          const noteJaId = `recommendation-${index}-note-ja`
          const noteEnId = `recommendation-${index}-note-en`
          const publishedId = `recommendation-${index}-published`

          return (
            <Card key={`${entry.kind}-${index}`}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle>
                      {entry.kind === 'youtube-video'
                        ? labels.videoType
                        : labels.channelType}
                    </CardTitle>
                    <CardDescription>
                      {preview
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
                        setEntries((current) => moveItem(current, index, -1))
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
                        setEntries((current) => moveItem(current, index, 1))
                      }}
                      disabled={index === entries.length - 1}
                      aria-label={labels.moveDown}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEntries((current) =>
                          current.filter((_, currentIndex) => currentIndex !== index),
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
                        setEntries((current) =>
                          current.map((currentEntry, currentIndex) =>
                            currentIndex === index && currentEntry.kind === 'youtube-video'
                              ? { ...currentEntry, sourceUrl: value }
                              : currentEntry,
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
                          setEntries((current) =>
                            current.map((currentEntry, currentIndex) =>
                              currentIndex === index && currentEntry.kind === 'youtube-channel'
                                ? { ...currentEntry, title: value }
                                : currentEntry,
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
                          setEntries((current) =>
                            current.map((currentEntry, currentIndex) =>
                              currentIndex === index && currentEntry.kind === 'youtube-channel'
                                ? { ...currentEntry, handle: value }
                                : currentEntry,
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
                          setEntries((current) =>
                            current.map((currentEntry, currentIndex) =>
                              currentIndex === index && currentEntry.kind === 'youtube-channel'
                                ? { ...currentEntry, url: value }
                                : currentEntry,
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
                        setEntries((current) =>
                          current.map((currentEntry, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentEntry,
                                  note: {
                                    ...currentEntry.note,
                                    ja: value,
                                  },
                                }
                              : currentEntry,
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
                        setEntries((current) =>
                          current.map((currentEntry, currentIndex) =>
                            currentIndex === index
                              ? {
                                  ...currentEntry,
                                  note: {
                                    ...currentEntry.note,
                                    en: value,
                                  },
                                }
                              : currentEntry,
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
                      setEntries((current) =>
                        current.map((currentEntry, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentEntry,
                                published: checked,
                              }
                            : currentEntry,
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
