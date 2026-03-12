import {
  LOCALE_PREFIXES,
  withLocales,
  type EditorCollectionDescriptor,
} from '@/lib/editor/editor.port'
import { parseLinkSourceEntries } from '@/features/links/links.assemble'

export const LINKS_COLLECTION_DESCRIPTOR: EditorCollectionDescriptor<'links'> = {
  id: 'links',
  label: 'Links',
  storagePath: 'editor/links.json',
  publicPaths: [
    ...withLocales('/links'),
    ...LOCALE_PREFIXES.map((locale) => ({
      path: `${locale}/links/[shortUrl]`,
      type: 'page' as const,
    })),
  ],
  getDefaultValue: () => [],
  parse: parseLinkSourceEntries,
}
