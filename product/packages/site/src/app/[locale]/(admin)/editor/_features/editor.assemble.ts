import { revalidatePath, revalidateTag } from 'next/cache'
import type { BlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { loadBlogPostsState, saveBlogPostState } from '@/app/[locale]/(main)/blog/_features/blog.infra'
import { loadNotesState, saveNotesState } from '@/app/[locale]/(main)/notes/_features/notes.infra'
import { loadPointersState, savePointersState } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.infra'
import { loadPuzzlesState, savePuzzlesState } from '@/app/[locale]/(main)/puzzles/_features/puzzles.infra'
import { loadRecommendationsState, saveRecommendationsState } from '@/app/[locale]/(main)/recommendations/_features/recommendations.infra'
import { loadLinksState, saveLinksState } from '@/features/links/links.infra'
import {
  getEditorCollectionMeta,
  type EditorCollectionId,
  type EditorCollectionState,
} from './editor-collections'
import {
  BLOG_INDEX_CONTENT_TAG,
  getBlogPostContentTag,
  getEditorCollectionContentTag,
} from '@/lib/content-store/content-tags.infra'

export class LoadEditorCollectionUseCase {
  async execute<K extends EditorCollectionId>(
    collectionId: K,
  ): Promise<EditorCollectionState<K>> {
    if (collectionId === 'recommendations') {
      return loadRecommendationsState() as unknown as Promise<EditorCollectionState<K>>
    }

    if (collectionId === 'notes') {
      return loadNotesState() as unknown as Promise<EditorCollectionState<K>>
    }

    if (collectionId === 'puzzles') {
      return loadPuzzlesState() as unknown as Promise<EditorCollectionState<K>>
    }

    if (collectionId === 'pointers') {
      return loadPointersState() as unknown as Promise<EditorCollectionState<K>>
    }

    if (collectionId === 'links') {
      return loadLinksState() as unknown as Promise<EditorCollectionState<K>>
    }

    return loadBlogPostsState() as unknown as Promise<EditorCollectionState<K>>
  }
}

export class SaveEditorCollectionUseCase {
  async execute(
    collectionId: EditorCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const result =
      collectionId === 'recommendations'
        ? await saveRecommendationsState(rawJson, expectedVersion)
        : collectionId === 'notes'
          ? await saveNotesState(rawJson, expectedVersion)
          : collectionId === 'puzzles'
            ? await savePuzzlesState(rawJson, expectedVersion)
            : collectionId === 'pointers'
              ? await savePointersState(rawJson, expectedVersion)
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

export class SaveBlogPostUseCase {
  async execute(
    slug: string,
    frontmatter: BlogFrontmatter,
    body: string,
    expectedVersion?: string,
  ) {
    await saveBlogPostState(slug, frontmatter, body, expectedVersion)
    revalidateTag(BLOG_INDEX_CONTENT_TAG, 'max')
    revalidateTag(getBlogPostContentTag(slug), 'max')
  }
}

export function makeLoadEditorCollectionUseCase() {
  return new LoadEditorCollectionUseCase()
}

export function makeSaveEditorCollectionUseCase() {
  return new SaveEditorCollectionUseCase()
}

export function makeSaveBlogPostUseCase() {
  return new SaveBlogPostUseCase()
}
