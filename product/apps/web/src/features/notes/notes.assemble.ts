import { cache } from 'react'
import { buildLocalizedNotePath } from './notes.urls'
import { createPublicNoteGraph, type NoteSourceEntry, type PublicNoteThreadItem } from '@tenzyu/publishing-domain/notes'
import type { ContentSnapshot } from '@tenzyu/revisioned-content/contracts'
import { loadPublicNoteEntries } from './notes.infra'

export type NotePageItem = {
  id: string
  body: string
  createdAt: string
  depth: number
  externalUrl?: string
  parent?: { href: string; excerpt: string }
  sharePath: string
}

export type NoteDetailPageData = {
  ancestors: NotePageItem[]
  note: NotePageItem
  replies: NotePageItem[]
}

const loadNoteSourceEntries = cache(loadPublicNoteEntries)

function publicNoteGraph(entries: readonly NoteSourceEntry[], locale: string) {
  const graph = createPublicNoteGraph(entries)
  const body = (entry: NoteSourceEntry) =>
    locale === 'ja' ? entry.body.ja : entry.body.en || entry.body.ja
  function item({ entry, depth, parent }: PublicNoteThreadItem): NotePageItem {
    return {
      id: entry.id,
      body: body(entry),
      createdAt: entry.createdAt,
      depth,
      externalUrl: entry.externalUrl,
      parent: parent && {
        href: buildLocalizedNotePath(locale, parent.id),
        excerpt: body(parent).replace(/\s+/g, ' ').trim().slice(0, 60),
      },
      sharePath: buildLocalizedNotePath(locale, entry.id),
    }
  }
  return {
    feed: () => graph.feed().map(item),
    thread(id: string): NoteDetailPageData | undefined {
      const thread = graph.thread(id)
      if (!thread) return undefined
      return {
        ancestors: thread.ancestors.map(item),
        note: item(thread.note),
        replies: thread.replies.map(item),
      }
    },
  }
}

export function assembleNoteThreadItems(
  entries: readonly NoteSourceEntry[],
  locale: string,
) {
  return publicNoteGraph(entries, locale).feed()
}

export async function loadPublishedNoteIds(snapshot: ContentSnapshot) {
  return (await loadNoteSourceEntries(snapshot)).map(({ id }) => id)
}

export function assembleNoteDetailPageDataFromEntries(
  entries: readonly NoteSourceEntry[],
  noteId: string,
  locale: string,
) {
  return publicNoteGraph(entries, locale).thread(noteId)
}

export const assembleNoteDetailPageData = cache(
  async (snapshot: ContentSnapshot, noteId: string, locale: string) => {
    const entries = await loadNoteSourceEntries(snapshot)
    return assembleNoteDetailPageDataFromEntries(entries, noteId, locale)
  },
)

export async function assembleNotesPageData(
  snapshot: ContentSnapshot,
  locale: string,
) {
  const entries = await loadNoteSourceEntries(snapshot)
  return assembleNoteThreadItems(entries, locale)
}
