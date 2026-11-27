import type { ContentSnapshot } from '@tenzyu/revisioned-content/contracts'
import { parseJsonCollection } from '@tenzyu/revisioned-content/json-document'
import { saveJsonCollection } from '@/platform/content-store/json-document.infra'
import { loadGitHubTextFileFresh } from '@/platform/content-store/github-content.infra'
import {
  LINKS_STORAGE_PATH,
  parseLinkSourceEntries,
} from './link-command.validation'

export async function loadPublicLinks(snapshot: ContentSnapshot) {
  const file = await snapshot.loadText(LINKS_STORAGE_PATH)
  return file ? parseLinkSourceEntries(JSON.parse(file.content)) : []
}

export async function loadLinksState() {
  const file = await loadGitHubTextFileFresh(LINKS_STORAGE_PATH)
  return parseJsonCollection(
    file?.content,
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
