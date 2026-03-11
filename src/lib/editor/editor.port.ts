import type { BlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import type {
  EditorCollectionData,
  EditorCollectionId,
  EditorState,
  RevalidatePathTarget,
} from './editor.domain'

export type {
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

export const LOCALE_PREFIXES = ['/ja', '/en'] as const

export function withLocales(pathname: string) {
  return LOCALE_PREFIXES.map((locale) => ({
    path: `${locale}${pathname}`,
  })) satisfies readonly RevalidatePathTarget[]
}

export interface EditorRepository {
  loadState<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
  ): Promise<EditorState<K>>

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
