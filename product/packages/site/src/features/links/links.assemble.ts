import { z } from 'zod'
import {
  LINK_CATEGORY_ORDER,
  defineLinks,
  type LinkCategory,
  type MyLink,
} from './links.domain'
import type { LinksRepository } from './links.port'
import { makeLinksRepository } from './links.infra'

const LinkSourceEntrySchema = z.object({
  name: z.string().trim().min(1),
  id: z.string().trim().min(1),
  url: z.string().trim().min(1),
  shortenUrl: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  category: z.enum(['Watch', 'Social', 'Build', 'Legacy']),
})

export function parseLinkSourceEntries(raw: unknown) {
  const links = z.array(LinkSourceEntrySchema).parse(raw)
  return defineLinks(links)
}

export class LoadLinksUseCase {
  constructor(private repository: LinksRepository) {}

  async execute(): Promise<readonly MyLink[]> {
    return defineLinks(await this.repository.loadAll())
  }
}

export function makeLoadLinksUseCase() {
  return new LoadLinksUseCase(makeLinksRepository())
}

export async function loadLinks() {
  const useCase = makeLoadLinksUseCase()
  return useCase.execute()
}

export function getLinkShortUrlStaticParams() {
  return loadLinks().then((links) =>
    links.map((link) => ({
      shortUrl: link.shortenUrl,
    })),
  )
}

export async function getLinkByShortUrl(shortUrl: string) {
  const links = await loadLinks()
  return links.find((link) => link.shortenUrl === shortUrl)
}

export { LINK_CATEGORY_ORDER }
export type { LinkCategory, MyLink }
