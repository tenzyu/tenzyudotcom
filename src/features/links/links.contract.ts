import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import { z } from 'zod'
import { editorRepository } from '@/lib/editor/editor.contract'
import {
  LOCALE_PREFIXES,
  withLocales,
  type EditorCollectionDescriptor,
} from '@/lib/editor/editor.port'
import type { MyLink } from './links.domain'
import type { LinksRepository } from './links.port'

const LinkSourceEntrySchema = z.object({
  name: z.string().trim().min(1),
  id: z.string().trim().min(1),
  url: z.string().trim().min(1),
  shortenUrl: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  category: z.enum(['Watch', 'Social', 'Build', 'Legacy']),
})

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

export function defineLinks<const T extends MyLink>(
  links: readonly T[],
): readonly T[] {
  const shortUrls = new Set<string>()
  const urls = new Set<string>()

  for (const link of links) {
    assertNonEmpty(link.name, 'link name')
    assertNonEmpty(link.id, `link id (${link.name})`)
    assertNonEmpty(link.shortenUrl, `link shortenUrl (${link.name})`)

    const normalizedUrl = normalizeExternalUrl(link.url, `link url (${link.name})`)

    if (shortUrls.has(link.shortenUrl)) {
      throw new Error(`Duplicate link shortenUrl: ${link.shortenUrl}`)
    }
    shortUrls.add(link.shortenUrl)

    if (urls.has(normalizedUrl)) {
      throw new Error(`Duplicate link url: ${normalizedUrl}`)
    }
    urls.add(normalizedUrl)
  }

  return links
}

export function parseLinkSourceEntries(raw: unknown) {
  const links = z.array(LinkSourceEntrySchema).parse(raw)
  return defineLinks(links)
}

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

export class EditorLinksRepository implements LinksRepository {
  async loadAll(): Promise<readonly MyLink[]> {
    const { collection } = await editorRepository.loadState(
      LINKS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}

export const linksRepository = new EditorLinksRepository()
