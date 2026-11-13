import type { MyLink } from './links.domain'

export interface LinksRepository {
  loadAll(): Promise<readonly MyLink[]>
}
