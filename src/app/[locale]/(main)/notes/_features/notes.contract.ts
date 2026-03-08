import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import { z } from 'zod'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().min(1),
})

const NoteSourceEntrySchema = z.object({
  body: LocalizedTextSchema,
  createdAt: z.string().datetime({ offset: true }),
  externalUrl: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
})

export function parseNoteSourceEntries(raw: unknown) {
  const entries = z.array(NoteSourceEntrySchema).parse(raw)

  for (const entry of entries) {
    if (entry.externalUrl) {
      normalizeExternalUrl(entry.externalUrl, `note external url (${entry.createdAt})`)
    }
  }

  return entries
}
