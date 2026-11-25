import { cache } from 'react'
import {
  buildLocalizedNotePath,
  compareNotesByCreatedAtAsc,
  compareNotesByCreatedAtDesc,
  type NoteSourceEntry,
} from './notes.domain'
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
  const visibleById = new Map(
    entries
      .filter((entry) => entry.published !== false)
      .map((entry) => [entry.id, entry]),
  )
  const childrenByParent = new Map<string, NoteSourceEntry[]>()
  const roots: NoteSourceEntry[] = []
  for (const entry of visibleById.values()) {
    if (entry.parentId && visibleById.has(entry.parentId)) {
      const siblings = childrenByParent.get(entry.parentId) ?? []
      siblings.push(entry)
      childrenByParent.set(entry.parentId, siblings)
    } else {
      roots.push(entry)
    }
  }
  roots.sort(compareNotesByCreatedAtDesc)
  for (const siblings of childrenByParent.values())
    siblings.sort(compareNotesByCreatedAtAsc)

  function body(entry: NoteSourceEntry) {
    return locale === 'ja' ? entry.body.ja : entry.body.en || entry.body.ja
  }

  function parentOf(entry: NoteSourceEntry) {
    return entry.parentId ? visibleById.get(entry.parentId) : undefined
  }

  function item(entry: NoteSourceEntry, depth: number): NotePageItem {
    const parent = parentOf(entry)
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

  function flatten(start: readonly NoteSourceEntry[], initialDepth: number) {
    const items: NotePageItem[] = []
    function visit(entry: NoteSourceEntry, depth: number) {
      items.push(item(entry, depth))
      for (const child of childrenByParent.get(entry.id) ?? [])
        visit(child, depth + 1)
    }
    for (const entry of start) visit(entry, initialDepth)
    return items
  }

  return {
    feed: () => flatten(roots, 0),
    thread(id: string): NoteDetailPageData | undefined {
      const target = visibleById.get(id)
      if (!target) return undefined
      const ancestors: NoteSourceEntry[] = []
      for (let parent = parentOf(target); parent; parent = parentOf(parent))
        ancestors.unshift(parent)
      return {
        ancestors: ancestors.map(item),
        note: item(target, ancestors.length),
        replies: flatten(childrenByParent.get(id) ?? [], ancestors.length + 1),
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
