import type { BlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import type {
  EditorCollectionData,
  EditorCollectionId,
  EditorState,
  RevalidatePathTarget,
} from './editor.domain'

export type EditorCollectionDescriptor<K extends EditorCollectionId> = {
  id: K
  label: string
  storagePath: string
  publicPaths: readonly RevalidatePathTarget[]
  getDefaultValue: () => EditorCollectionData[K]
  parse: (raw: unknown) => EditorCollectionData[K]
}

export interface EditorRepository {
  loadState<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
  ): Promise<EditorState<K>>

  loadBlogCollectionState(): Promise<EditorState<'blog'>>

  save<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{
    version: string
  }>

  saveBlogPost(
    slug: string,
    frontmatter: BlogFrontmatter,
    body: string,
    expectedVersion?: string,
  ): Promise<void>
}
