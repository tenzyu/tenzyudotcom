import type { MDXData } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { withLocales } from '@/lib/editor/editor.domain'
import type { EditorCollectionDescriptor } from '@/lib/editor/editor.port'

export const BLOG_COLLECTION_DESCRIPTOR: EditorCollectionDescriptor<'blog'> = {
  id: 'blog',
  label: 'Blog',
  storagePath: 'blog',
  publicPaths: withLocales('/blog'),
  getDefaultValue: () => [],
  parse: (raw: unknown) => raw as MDXData[],
}
