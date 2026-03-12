import { revalidatePath } from 'next/cache'
import type {
  EditorCollectionId,
  RevalidatePathTarget,
  EditorRepository,
  EditorState,
} from '@/lib/editor/editor.port'
import type { BlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { makeEditorRepository } from '@/lib/editor/editor.assemble'
import { getEditorCollectionDescriptor } from './editor.collections'

export class LoadEditorCollectionUseCase {
  constructor(private repository: EditorRepository) {}

  async execute<K extends EditorCollectionId>(
    collectionId: K,
  ): Promise<EditorState<K>> {
    if (collectionId === 'blog') {
      return this.repository.loadBlogCollectionState() as Promise<EditorState<K>>
    }

    const descriptor = getEditorCollectionDescriptor(collectionId)
    return this.repository.loadState(descriptor)
  }
}

export class SaveEditorCollectionUseCase {
  constructor(private repository: EditorRepository) {}

  async execute(
    collectionId: EditorCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const descriptor = getEditorCollectionDescriptor(collectionId)
    const result = await this.repository.save(
      descriptor,
      rawJson,
      expectedVersion,
    )

    // Revalidate paths
    for (const path of descriptor.publicPaths) {
      const target = path as RevalidatePathTarget
      if (target.type) {
        revalidatePath(target.path, target.type)
      } else {
        revalidatePath(target.path)
      }
    }

    return result
  }
}

export class SaveBlogPostUseCase {
  constructor(private repository: EditorRepository) {}

  async execute(
    slug: string,
    frontmatter: BlogFrontmatter,
    body: string,
    expectedVersion?: string,
  ) {
    await this.repository.saveBlogPost(
      slug,
      frontmatter,
      body,
      expectedVersion,
    )
  }
}

// Factories
export function makeLoadEditorCollectionUseCase() {
  return new LoadEditorCollectionUseCase(makeEditorRepository())
}

export function makeSaveEditorCollectionUseCase() {
  return new SaveEditorCollectionUseCase(makeEditorRepository())
}

export function makeSaveBlogPostUseCase() {
  return new SaveBlogPostUseCase(makeEditorRepository())
}
