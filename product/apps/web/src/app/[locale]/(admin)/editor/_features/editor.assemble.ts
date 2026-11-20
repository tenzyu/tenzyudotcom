import { revalidatePath, revalidateTag } from 'next/cache'
import type { BlogSaveCommand } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import {
  loadBlogPostsState,
  saveBlogPost,
} from '@/app/[locale]/(main)/blog/_features/blog.infra'
import {
  loadNotesState,
  saveNotesState,
} from '@/app/[locale]/(main)/notes/_features/notes.infra'
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

class LoadEditorCollectionUseCase {
  async execute<K extends EditorCollectionId>(
    collectionId: K,
  ): Promise<EditorCollectionState<K>> {
    return collectionLoaders[collectionId]()
  }
}

class SaveEditorCollectionUseCase {
  async execute(
    collectionId: WritableEditorCollectionId,
    rawJson: string,
    expectedVersion: string,
  ): Promise<{ version: string }> {
    if (collectionId === 'notes')
      return saveNotesState(rawJson, expectedVersion)

    const result = await saveLinksState(rawJson, expectedVersion)
    const collection = getEditorCollectionMeta('links')
    revalidateTag(getEditorCollectionContentTag('links'), 'max')

    for (const path of collection.publicPaths) {
      if (path.type) {
        revalidatePath(path.path, path.type)
      } else {
        revalidatePath(path.path)
      }
    }

    return result
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

export function makeLoadEditorCollectionUseCase() {
  return new LoadEditorCollectionUseCase()
}

export function makeSaveEditorCollectionUseCase() {
  return new SaveEditorCollectionUseCase()
}
