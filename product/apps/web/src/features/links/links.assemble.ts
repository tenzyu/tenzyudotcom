import { defineLinks, type MyLink } from './links.domain'
import type { LinksRepository } from './links.port'
import { makeLinksRepository } from './links.infra'

class LoadLinksUseCase {
  constructor(private repository: LinksRepository) {}

  async execute(): Promise<readonly MyLink[]> {
    return defineLinks(await this.repository.loadAll())
  }
}

function makeLoadLinksUseCase() {
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
