import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import { z } from 'zod'
import {
  withLocales,
} from '@/lib/editor/editor.domain'
import type { EditorCollectionDescriptor } from '@/lib/editor/editor.port'
import { normalizeYouTubeVideoId } from '@/features/youtube/youtube.domain'
import { normalizeRecommendationVideoSource } from '@/features/recommendations/recommendation-source.domain'

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

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

function assertUniqueStrings(
  items: readonly string[],
  label: string,
) {
  const values = new Set<string>()

  for (const item of items) {
    if (values.has(item)) {
      throw new Error(`Duplicate ${label}: ${item}`)
    }
    values.add(item)
  }
}

function defineRecommendationChannels<
  const T extends { title: string; handle: string; url: string },
>(
  channels: readonly T[],
): readonly T[] {
  assertUniqueStrings(
    channels.map((channel) =>
      normalizeExternalUrl(
        channel.url,
        `recommendation channel url (${channel.title})`,
      ),
    ),
    'recommendation channel url',
  )

  for (const channel of channels) {
    assertNonEmpty(channel.title, `recommendation channel title (${channel.title})`)
    assertNonEmpty(
      channel.handle,
      `recommendation channel handle (${channel.title})`,
    )
  }

  return channels
}

function defineRecommendationVideos<const T extends { id: string }>(
  videos: readonly T[],
): readonly T[] {
  assertUniqueStrings(
    videos.map((video) => video.id),
    'recommendation video id',
  )

  for (const video of videos) {
    normalizeYouTubeVideoId(video.id)
  }

  return videos
}

function parseRecommendationSourceEntries(raw: unknown) {
  const entries = z.array(RecommendationSourceEntrySchema).parse(raw)

  defineRecommendationChannels(
    entries
      .filter((entry) => entry.kind === 'youtube-channel')
      .map((entry) => ({
        title: entry.title,
        handle: entry.handle,
        url: entry.url,
      })),
  )

  defineRecommendationVideos(
    entries
      .filter((entry) => entry.kind === 'youtube-video')
      .map((entry) => ({
        id: normalizeRecommendationVideoSource(
          entry.sourceUrl,
          `recommendation video source (${entry.sourceUrl})`,
        ),
      })),
  )

  for (const entry of entries) {
    if (entry.kind === 'youtube-video') {
      normalizeRecommendationVideoSource(
        entry.sourceUrl,
        `recommendation video source (${entry.sourceUrl})`,
      )
      continue
    }

    normalizeExternalUrl(
      entry.url,
      `recommendation channel url (${entry.title})`,
    )
  }

  return entries
}

export const RECOMMENDATIONS_COLLECTION_DESCRIPTOR: EditorCollectionDescriptor<'recommendations'> = {
  id: 'recommendations',
  label: 'Recommendations',
  storagePath: 'editor/recommendations.json',
  publicPaths: withLocales('/recommendations'),
  getDefaultValue: () => [],
  parse: parseRecommendationSourceEntries,
}
