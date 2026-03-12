import { BLOG_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/blog'
import { LINKS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/links'
import { NOTES_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/notes'
import { POINTERS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/pointers'
import { PUZZLES_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/puzzles'
import { RECOMMENDATIONS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/recommendations'
import type {
  EditorCollectionDescriptor,
} from '@/lib/editor/editor.port'
import type { EditorCollectionId } from '@/lib/editor/editor.domain'

export const EDITOR_COLLECTIONS: {
  [K in EditorCollectionId]: EditorCollectionDescriptor<K>
} = {
  recommendations: RECOMMENDATIONS_COLLECTION_DESCRIPTOR,
  notes: NOTES_COLLECTION_DESCRIPTOR,
  puzzles: PUZZLES_COLLECTION_DESCRIPTOR,
  pointers: POINTERS_COLLECTION_DESCRIPTOR,
  links: LINKS_COLLECTION_DESCRIPTOR,
  blog: BLOG_COLLECTION_DESCRIPTOR,
}

export function getEditorCollectionDescriptor<
  K extends EditorCollectionId,
>(id: K): EditorCollectionDescriptor<K> {
  return EDITOR_COLLECTIONS[id]
}

export function listEditorCollectionDescriptors() {
  return Object.values(EDITOR_COLLECTIONS)
}
