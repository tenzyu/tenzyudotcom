import type { ContentSnapshot } from '@tenzyu/revisioned-content/contracts'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/platform/content-store/json-document.infra'
import {
  LINKS_STORAGE_PATH,
  parseLinkSourceEntries,
} from './link-command.validation'

export async function loadPublicLinks(snapshot: ContentSnapshot) {
  const file = await snapshot.loadText(LINKS_STORAGE_PATH)
  return file ? parseLinkSourceEntries(JSON.parse(file.content)) : []
}

export async function loadLinksState() {
  return loadJsonCollection(
    LINKS_STORAGE_PATH,
    parseLinkSourceEntries,
    () => [],
  )
}

export async function saveLinksState(rawJson: string, expectedVersion?: string) {
  return saveJsonCollection(
    LINKS_STORAGE_PATH,
    rawJson,
    parseLinkSourceEntries,
    expectedVersion,
  )
}
