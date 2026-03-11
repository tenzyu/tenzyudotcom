import { NOTES_COLLECTION_DESCRIPTOR } from '@/app/[locale]/(main)/notes/_features/notes.contract'
import { POINTERS_COLLECTION_DESCRIPTOR } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.contract'
import { PUZZLES_COLLECTION_DESCRIPTOR } from '@/app/[locale]/(main)/puzzles/_features/puzzles.contract'
import { RECOMMENDATIONS_COLLECTION_DESCRIPTOR } from '@/app/[locale]/(main)/recommendations/_features/recommendations.contract'
import { LINKS_COLLECTION_DESCRIPTOR } from '@/features/links/links.contract'
import { BLOG_COLLECTION_DESCRIPTOR } from '@/app/[locale]/(main)/blog/_features/blog.contract'
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
