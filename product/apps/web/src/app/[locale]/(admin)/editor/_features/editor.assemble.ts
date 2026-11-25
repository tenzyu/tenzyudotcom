import { revalidatePath, revalidateTag } from 'next/cache'
import type { BlogSaveCommand } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import {
  loadBlogPostsState,
  saveBlogPost,
} from '@/app/[locale]/(main)/blog/_features/blog.infra'
import {
  loadNotesState,
  saveNotesState,
} from '@/features/notes/notes.infra'
import { loadScrapEditorIndexState } from '@/features/content-editor/scrap-editor.assemble'
import { loadLinksState, saveLinksState } from '@/features/links/links.infra'
import {
  getEditorCollectionMeta,
  type EditorCollectionId,
  type EditorCollectionState,
  type WritableEditorCollectionId,
} from '@/features/content-editor/editor-collections'
import { getEditorCollectionContentTag } from '@/lib/content-store/content-tags.infra'
import { githubContentRepository } from '@/lib/content-store/github-content.infra'
import { confirmBlogPublication } from './blog-save-form-state'

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

  const result = await saveLinksState(rawJson, expectedVersion)
  refreshLinksAfterSave()

  return result
}

export function refreshLinksAfterSave() {
  revalidateTag(getEditorCollectionContentTag('links'), { expire: 0 })
  for (const path of getEditorCollectionMeta('links').publicPaths) {
    revalidatePath(path.path, path.type)
  }
}

export async function publishEditorBlog(command: BlogSaveCommand) {
  return confirmBlogPublication(await saveBlogPost(command))
}

export async function checkEditorBlogPublication(candidateOid: string) {
  const headOid = await githubContentRepository.reconcile(candidateOid)
  return headOid
    ? confirmBlogPublication({
        commitOid: candidateOid,
        headOid,
        status: 'reconciled',
      })
    : null
}
