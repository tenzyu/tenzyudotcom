import { z } from 'zod'
import type { MyLink } from './links.domain'
import { defineLinks } from './links.domain'
import type { ContentSnapshot } from '@/lib/content-store/content-store.domain'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/lib/content-store/json-document.infra'

const LINKS_STORAGE_PATH = 'editor/links.json'

const LinkSourceEntrySchema = z.object({
  name: z.string().trim().min(1),
  id: z.string().trim().min(1),
  url: z.string().trim().min(1),
  shortenUrl: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  category: z.enum(['Watch', 'Social', 'Build', 'Legacy']),
})

function parseLinkSourceEntries(raw: unknown) {
  const links = z.array(LinkSourceEntrySchema).parse(raw)
  return defineLinks(links)
}

export async function loadPublicLinks(snapshot: ContentSnapshot) {
  const file = await snapshot.loadText(LINKS_STORAGE_PATH)
  return file ? parseLinkSourceEntries(JSON.parse(file.content)) : []
}

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
