import type { MyLink } from './links.domain'
import type { LinksRepository } from './links.port'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/lib/content-store/json-document.infra'
import { parseLinkSourceEntries } from './links.assemble'

const LINKS_STORAGE_PATH = 'editor/links.json'

export async function loadLinksState() {
  return loadJsonCollection(
    LINKS_STORAGE_PATH,
    parseLinkSourceEntries,
    () => [] as readonly MyLink[],
  )
}

export async function saveLinksState(
  rawJson: string,
  expectedVersion?: string,
) {
  return saveJsonCollection(
    LINKS_STORAGE_PATH,
    rawJson,
    parseLinkSourceEntries,
    expectedVersion,
  )
}

export class LinksStorageRepository implements LinksRepository {
  async loadAll(): Promise<readonly MyLink[]> {
    const { collection } = await loadLinksState()
    return collection
  }
}

export function makeLinksRepository() {
  return new LinksStorageRepository()
}
