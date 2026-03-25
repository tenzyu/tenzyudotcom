import { cache } from 'react'
import {
  buildLocalizedNotePath,
  compareNotesByCreatedAtAsc,
  compareNotesByCreatedAtDesc,
} from './notes.domain'
import type { NoteSourceEntry } from './notes.domain'
import type { NotesRepository } from './notes.port'
import { makeNotesRepository } from './notes.infra'

export type NotePageItem = {
  id: string
  body: string
  createdAt: string
  depth: number
  externalUrl?: string
  parentId?: string
  hasConnectorAbove: boolean
  hasConnectorBelow: boolean
  sharePath: string
  showBottomBorder: boolean
}

type FlattenedNoteItem = {
  entry: NoteSourceEntry
  depth: number
  threadRootId: string
}

export type NoteDetailPageData = {
  ancestors: NotePageItem[]
  note: NotePageItem
  replies: NotePageItem[]
}

export class LoadNotesUseCase {
  constructor(private repository: NotesRepository) {}

  async execute(): Promise<readonly NoteSourceEntry[]> {
    const entries = await this.repository.loadAll()
    return entries.filter((entry) => entry.published !== false)
  }
}

export function makeLoadNotesUseCase() {
  return new LoadNotesUseCase(makeNotesRepository())
}

const loadNoteSourceEntries = cache(async () => {
  const useCase = makeLoadNotesUseCase()
  return useCase.execute()
})

function flattenPublishedNoteThread(entries: readonly NoteSourceEntry[]) {
  const publishedEntries = entries.filter((entry) => entry.published !== false)
  const publishedEntryIds = new Set(publishedEntries.map((entry) => entry.id))
  const childrenByParentId = new Map<string, NoteSourceEntry[]>()
  const topLevelEntries: NoteSourceEntry[] = []

  for (const entry of publishedEntries) {
    if (entry.parentId && publishedEntryIds.has(entry.parentId)) {
      const siblings = childrenByParentId.get(entry.parentId) ?? []
      siblings.push(entry)
      childrenByParentId.set(entry.parentId, siblings)
      continue
    }

    topLevelEntries.push(entry)
  }

  topLevelEntries.sort(compareNotesByCreatedAtDesc)

  for (const siblings of childrenByParentId.values()) {
    siblings.sort(compareNotesByCreatedAtAsc)
  }

  const items: FlattenedNoteItem[] = []

  function appendEntry(
    entry: NoteSourceEntry,
    depth: number,
    threadRootId: string,
  ) {
    items.push({
      entry,
      depth,
      threadRootId,
    })

    const children = childrenByParentId.get(entry.id) ?? []

    for (const child of children) {
      appendEntry(child, depth + 1, threadRootId)
    }
  }

  for (const entry of topLevelEntries) {
    appendEntry(entry, 0, entry.id)
  }

  return items
}

function mapFlattenedNoteItems(
  items: readonly FlattenedNoteItem[],
  locale: string,
): NotePageItem[] {
  const noteLocale = locale === 'ja' ? 'ja' : 'en'

  return items.map((item, index) => {
    const previousItem = items[index - 1]
    const nextItem = items[index + 1]
    const hasConnectorAbove =
      item.depth > 0 && previousItem?.threadRootId === item.threadRootId
    const hasConnectorBelow =
      Boolean(nextItem) &&
      nextItem.threadRootId === item.threadRootId &&
      nextItem.depth > 0

    return {
      id: item.entry.id,
      body: item.entry.body[noteLocale] || item.entry.body.ja,
      createdAt: item.entry.createdAt,
      depth: item.depth,
      externalUrl: item.entry.externalUrl,
      parentId: item.entry.parentId,
      hasConnectorAbove,
      hasConnectorBelow,
      sharePath: buildLocalizedNotePath(locale, item.entry.id),
      showBottomBorder: !hasConnectorBelow,
    }
  })
}

export function assembleNoteThreadItems(
  entries: readonly NoteSourceEntry[],
  locale: string,
): NotePageItem[] {
  return mapFlattenedNoteItems(flattenPublishedNoteThread(entries), locale)
}

export async function getNoteStaticParams() {
  const entries = await loadNoteSourceEntries()
  return entries.map((entry) => ({
    id: entry.id,
  }))
}

export function assembleNoteDetailPageDataFromEntries(
  entries: readonly NoteSourceEntry[],
  noteId: string,
  locale: string,
): NoteDetailPageData | undefined {
  const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
  const target = entriesById.get(noteId)

  if (!target) {
    return undefined
  }

  const targetEntry = target

  const ancestorEntries: NoteSourceEntry[] = []
  let currentParentId = targetEntry.parentId

  while (currentParentId) {
    const parent = entriesById.get(currentParentId)

    if (!parent || parent.published === false) {
      break
    }

    ancestorEntries.unshift(parent)
    currentParentId = parent.parentId
  }

  const replyEntries: FlattenedNoteItem[] = []
  const visibleEntries = entries.filter((entry) => entry.published !== false)
  const childrenByParentId = new Map<string, NoteSourceEntry[]>()

  for (const entry of visibleEntries) {
    if (!entry.parentId) {
      continue
    }

    const siblings = childrenByParentId.get(entry.parentId) ?? []
    siblings.push(entry)
    childrenByParentId.set(entry.parentId, siblings)
  }

  for (const siblings of childrenByParentId.values()) {
    siblings.sort(compareNotesByCreatedAtAsc)
  }

  function appendReplyTree(entry: NoteSourceEntry, depth: number) {
    replyEntries.push({
      entry,
      depth,
      threadRootId: ancestorEntries[0]?.id ?? targetEntry.id,
    })

    const children = childrenByParentId.get(entry.id) ?? []

    for (const child of children) {
      appendReplyTree(child, depth + 1)
    }
  }

  for (const child of childrenByParentId.get(targetEntry.id) ?? []) {
    appendReplyTree(child, ancestorEntries.length + 1)
  }

  const detailItems = mapFlattenedNoteItems(
    [
      ...ancestorEntries.map((entry, index) => ({
        entry,
        depth: index,
        threadRootId: ancestorEntries[0]?.id ?? targetEntry.id,
      })),
      {
        entry: targetEntry,
        depth: ancestorEntries.length,
        threadRootId: ancestorEntries[0]?.id ?? targetEntry.id,
      },
      ...replyEntries,
    ],
    locale,
  )

  const noteIndex = detailItems.findIndex((item) => item.id === target.id)

  if (noteIndex < 0) {
    return undefined
  }

  const note = detailItems[noteIndex]

  if (!note) {
    return undefined
  }

  return {
    ancestors: detailItems.slice(0, noteIndex),
    note,
    replies: detailItems.slice(noteIndex + 1),
  }
}

export async function assembleNoteDetailPageData(
  noteId: string,
  locale: string,
): Promise<NoteDetailPageData | undefined> {
  const entries = await loadNoteSourceEntries()
  return assembleNoteDetailPageDataFromEntries(entries, noteId, locale)
}

export async function assembleNotesPageData(
  locale: string,
): Promise<NotePageItem[]> {
  const entries = await loadNoteSourceEntries()
  return assembleNoteThreadItems(entries, locale)
}
