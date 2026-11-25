import type { MDXData } from '@/features/blog/blog.domain'
import type { NoteSourceEntry } from '@/features/notes/notes.domain'
import type { ScrapIndexEntry } from '@/features/scraps/scraps.domain'
import type { MyLink } from '@/features/links/links.domain'
import type {
  StoredCollectionState,
} from '@/platform/content-store/content-store.domain'

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

type RevalidatePathTarget = {
  path: string
  type?: 'page' | 'layout'
}

export type EditorCollectionMeta = {
  id: EditorCollectionId
  label: string
  publicPaths: readonly RevalidatePathTarget[]
}

export type EditorCollectionDefinition<K extends EditorCollectionId> =
  EditorCollectionMeta & {
    load: () => Promise<EditorCollectionState<K>>
  }

export type WritableEditorCollectionDefinition<
  K extends WritableEditorCollectionId,
> = EditorCollectionDefinition<K> & {
  save: (
    sourceJson: string,
    expectedVersion: string,
  ) => Promise<{ version: string }>
}

const EDITOR_COLLECTIONS: Record<EditorCollectionId, EditorCollectionMeta> = {
  notes: {
    id: 'notes',
    label: 'Notes',
    publicPaths: [],
  },
  scraps: {
    id: 'scraps',
    label: 'Scraps',
    publicPaths: [],
  },
  links: {
    id: 'links',
    label: 'Links',
    publicPaths: [],
  },
  blog: {
    id: 'blog',
    label: 'Blog',
    publicPaths: [],
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
