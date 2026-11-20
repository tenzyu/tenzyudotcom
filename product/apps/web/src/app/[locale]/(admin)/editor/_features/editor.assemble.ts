import { revalidatePath, revalidateTag } from 'next/cache'
import { getLocalizedUrl } from 'intlayer'
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
import {
  BLOG_INDEX_CONTENT_TAG,
  getBlogPostContentTag,
  getEditorCollectionContentTag,
} from '@/lib/content-store/content-tags.infra'
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
    const result =
      collectionId === 'notes'
        ? await saveNotesState(rawJson, expectedVersion)
        : await saveLinksState(rawJson, expectedVersion)
    const collection = getEditorCollectionMeta(collectionId)

    revalidateTag(getEditorCollectionContentTag(collectionId), 'max')

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

function refreshBlogAfterPublication(slug: string, locale: string) {
  revalidateTag(BLOG_INDEX_CONTENT_TAG, 'max')
  revalidateTag(getBlogPostContentTag(slug), 'max')
  for (const language of ['ja', 'en']) {
    revalidatePath(getLocalizedUrl('/blog', language))
    revalidatePath(getLocalizedUrl(`/blog/${slug}`, language))
  }
  revalidatePath(getLocalizedUrl('/editor/blog', locale))
}

export async function publishEditorBlog(
  command: BlogSaveCommand,
  locale: string,
) {
  const receipt = await saveBlogPost(command)
  return confirmBlogPublication(receipt, () =>
    refreshBlogAfterPublication(command.slug, locale),
  )
}

export async function checkEditorBlogPublication(
  candidateOid: string,
  slug: string,
  locale: string,
) {
  const headOid = await githubContentRepository.reconcile(candidateOid)
  return headOid
    ? confirmBlogPublication(
        { commitOid: candidateOid, headOid, status: 'reconciled' },
        () => refreshBlogAfterPublication(slug, locale),
      )
    : null
}

export function makeLoadEditorCollectionUseCase() {
  return new LoadEditorCollectionUseCase()
}

export function makeSaveEditorCollectionUseCase() {
  return new SaveEditorCollectionUseCase()
}
