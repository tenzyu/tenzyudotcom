import { defineLinks } from './links.contract'
import {
  LINK_CATEGORY_ORDER,
  type LinkCategory,
  type MyLink,
} from './links.domain'
import type { LinksRepository } from './links.port'
import { linksRepository } from './links.contract'

export class LoadLinksUseCase {
  constructor(private repository: LinksRepository) {}

  async execute(): Promise<readonly MyLink[]> {
    return defineLinks(await this.repository.loadAll())
  }
}

export function makeLoadLinksUseCase() {
  return new LoadLinksUseCase(linksRepository)
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
