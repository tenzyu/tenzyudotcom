import { z } from 'zod'
import {
  LocalizedDocumentRefSchema,
  ScrapEntryMetaSchema,
  ScrapManifestSchema,
} from '@/features/scraps/scraps.validation'

const oid = z.string().regex(/^[0-9a-f]{40}$/)
const Document = LocalizedDocumentRefSchema.extend({ source: z.string() })

export const ScrapWorkspaceViewSchema = z.object({
  version: oid,
  manifest: ScrapManifestSchema,
  lead: z.array(Document),
  entries: z.array(
    z.object({ meta: ScrapEntryMetaSchema, documents: z.array(Document) }),
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
