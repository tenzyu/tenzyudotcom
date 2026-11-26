import type { MDXData } from '@tenzyu/publishing-domain/blog'
import type { NoteSourceEntry } from '@tenzyu/publishing-domain/notes'
import type { ScrapIndexEntry } from '@tenzyu/publishing-domain/scraps'
import type { MyLink } from '@tenzyu/publishing-domain/links'
import type { StoredCollectionState } from '@tenzyu/revisioned-content/contracts'

const EDITOR_COLLECTION_IDS = ['notes', 'scraps', 'links', 'blog'] as const

export type EditorCollectionId = (typeof EDITOR_COLLECTION_IDS)[number]

export type EditorCollectionData = {
  notes: readonly NoteSourceEntry[]
  scraps: readonly ScrapIndexEntry[]
  links: readonly MyLink[]
  blog: readonly MDXData[]
}

export type EditorCollectionState<K extends EditorCollectionId> =
  StoredCollectionState<EditorCollectionData[K]>

export type WritableEditorCollectionId = 'notes' | 'links'

export type EditorCollectionMeta = {
  id: EditorCollectionId
  label: string
}

const EDITOR_COLLECTIONS: Record<EditorCollectionId, EditorCollectionMeta> = {
  notes: {
    id: 'notes',
    label: 'Notes',
  },
  scraps: {
    id: 'scraps',
    label: 'Scraps',
  },
  links: {
    id: 'links',
    label: 'Links',
  },
  blog: {
    id: 'blog',
    label: 'Blog',
  },
}

export function getEditorCollectionMeta<K extends EditorCollectionId>(id: K) {
  return EDITOR_COLLECTIONS[id]
}

export function listEditorCollectionMeta() {
  return Object.values(EDITOR_COLLECTIONS)
}

export function isEditorCollectionId(
  value: string,
): value is EditorCollectionId {
  return EDITOR_COLLECTION_IDS.some((id) => id === value)
}

export function isWritableEditorCollectionId(
  value: string,
): value is WritableEditorCollectionId {
  return value === 'notes' || value === 'links'
}
