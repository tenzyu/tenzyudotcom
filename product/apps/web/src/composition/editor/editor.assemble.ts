import { loadBlogPostsState } from '@/features/blog/blog.infra'
import {
  loadNotesState,
  saveNotesState,
} from '@/features/notes/notes.infra'
import { loadScrapEditorIndexState } from '@/features/scraps/editor/scrap-editor.assemble'
import { loadLinksState } from '@/features/links/links.infra'
import { saveLinksCollection } from '@/features/links/links-cache'
import {
  type EditorCollectionId,
  type EditorCollectionState,
  type WritableEditorCollectionId,
} from './editor-collections'

const collectionLoaders: {
  [K in EditorCollectionId]: () => Promise<EditorCollectionState<K>>
} = {
  notes: loadNotesState,
  links: loadLinksState,
  blog: loadBlogPostsState,
  scraps: loadScrapEditorIndexState,
}

export async function loadEditorCollection<K extends EditorCollectionId>(
  collectionId: K,
): Promise<EditorCollectionState<K>> {
  return collectionLoaders[collectionId]()
}

export async function saveEditorCollection(
  collectionId: WritableEditorCollectionId,
  rawJson: string,
  expectedVersion: string,
): Promise<{ version: string }> {
  if (collectionId === 'notes')
    return saveNotesState(rawJson, expectedVersion)

  return saveLinksCollection(rawJson, expectedVersion)
}
