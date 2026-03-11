import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import { z } from 'zod'
import { withLocales, type EditorCollectionDescriptor } from '@/lib/editor/editor.port'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
})

const NoteSourceEntrySchema = z.object({
  body: LocalizedTextSchema,
  createdAt: z.string().datetime({ offset: true }),
  externalUrl: z.string().trim().min(1).optional(),
  published: z.boolean().optional(),
})

function parseNoteSourceEntries(raw: unknown) {
  const entries = z.array(NoteSourceEntrySchema).parse(raw)

  for (const entry of entries) {
    if (entry.externalUrl) {
      normalizeExternalUrl(entry.externalUrl, `note external url (${entry.createdAt})`)
    }
  }

  return entries
}

export const NOTES_COLLECTION_DESCRIPTOR: EditorCollectionDescriptor<'notes'> = {
  id: 'notes',
  label: 'Notes',
  storagePath: 'editor/notes.json',
  publicPaths: withLocales('/notes'),
  getDefaultValue: () => [],
  parse: parseNoteSourceEntries,
}
