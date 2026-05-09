import { z } from 'zod'
import type {
  RecommendationSourceEntry,
} from '@/features/recommendations/recommendations.domain'
import type { RecommendationsRepository } from './recommendations.port'
export { isRecommendationTabId } from '@/features/recommendations/recommendations.domain'
import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.domain'
import { normalizeRecommendationVideoSource } from '@/features/recommendations/recommendation-source.domain'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/lib/content-store/json-document.infra'

const RECOMMENDATIONS_STORAGE_PATH = 'editor/recommendations.json'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
})

const RecommendationSourceVideoEntrySchema = z.object({
  kind: z.literal('youtube-video'),
  sourceUrl: z.string().trim().min(1),
  note: LocalizedTextSchema,
  published: z.boolean().optional(),
})

const RecommendationSourceChannelEntrySchema = z.object({
  kind: z.literal('youtube-channel'),
  title: z.string().trim().min(1),
  handle: z.string().trim().min(1),
  url: z.string().trim().min(1),
  note: LocalizedTextSchema,
  published: z.boolean().optional(),
})

const RecommendationSourceEntrySchema = z.discriminatedUnion('kind', [
  RecommendationSourceVideoEntrySchema,
  RecommendationSourceChannelEntrySchema,
])

function assertUniqueStrings(items: readonly string[], label: string) {
  const values = new Set<string>()

  for (const item of items) {
    if (values.has(item)) {
      throw new Error(`Duplicate ${label}: ${item}`)
    }
    values.add(item)
  }
}

export function parseRecommendationSourceEntries(raw: unknown) {
  const entries = z.array(RecommendationSourceEntrySchema).parse(raw)

  assertUniqueStrings(
    entries
      .filter((entry) => entry.kind === 'youtube-channel')
      .map((entry) =>
        normalizeExternalUrl(
          entry.url,
          `recommendation channel url (${entry.title})`,
        ),
      ),
    'recommendation channel url',
  )

  assertUniqueStrings(
    entries
      .filter((entry) => entry.kind === 'youtube-video')
      .map((entry) =>
        normalizeRecommendationVideoSource(
          entry.sourceUrl,
          `recommendation video source (${entry.sourceUrl})`,
        ),
      ),
    'recommendation video id',
  )

  for (const entry of entries) {
    if (entry.kind === 'youtube-video') {
      normalizeYouTubeVideoId(
        normalizeRecommendationVideoSource(
          entry.sourceUrl,
          `recommendation video source (${entry.sourceUrl})`,
        ),
      )
      continue
    }

    normalizeExternalUrl(entry.url, `recommendation channel url (${entry.title})`)
  }

  return entries
}

export async function loadRecommendationsState() {
  return loadJsonCollection(
    RECOMMENDATIONS_STORAGE_PATH,
    parseRecommendationSourceEntries,
    () => [] as readonly RecommendationSourceEntry[],
  )
}

export async function saveRecommendationsState(
  rawJson: string,
  expectedVersion?: string,
) {
  return saveJsonCollection(
    RECOMMENDATIONS_STORAGE_PATH,
    rawJson,
    parseRecommendationSourceEntries,
    expectedVersion,
  )
}

export class RecommendationsStorageRepository implements RecommendationsRepository {
  async loadAll(): Promise<readonly RecommendationSourceEntry[]> {
    const { collection } = await loadRecommendationsState()
    return collection
  }
}

export function makeRecommendationsRepository() {
  return new RecommendationsStorageRepository()
}
