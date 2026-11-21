import { z } from 'zod'
import {
  CONTENT_LOCALES,
  TRANSLATION_STATES,
} from '@/features/scraps/scraps.domain'
import {
  parseScrapEntryMeta,
  parseScrapManifest,
} from '@/features/scraps/scraps.validation'

const oid = z.string().regex(/^[0-9a-f]{40}$/)
const Document = z.object({
  locale: z.enum(CONTENT_LOCALES),
  state: z.enum(TRANSLATION_STATES),
  source: z.string(),
})

export const ScrapWorkspaceViewSchema = z.object({
  version: oid,
  manifest: z.unknown().transform(parseScrapManifest),
  lead: z.array(Document),
  entries: z.array(
    z.object({
      meta: z.unknown().transform(parseScrapEntryMeta),
      documents: z.array(Document),
    }),
  ),
})
export type ScrapWorkspaceView = z.output<typeof ScrapWorkspaceViewSchema>

export const ScrapWorkspaceResult = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saved'), version: oid }),
  z.object({
    kind: z.literal('uncertain'),
    candidate: oid.optional(),
    message: z.string(),
  }),
  z.object({
    kind: z.enum(['conflict', 'invalid', 'unavailable', 'denied', 'retry']),
    message: z.string(),
  }),
])
export type ScrapWorkspaceResult = z.output<typeof ScrapWorkspaceResult>
