import { z } from 'zod'
import {
  CONTENT_LOCALES,
  SCRAP_STATUSES,
  SCRAP_ENTRY_KINDS,
  isValidScrapSlug,
  isValidScrapEntryId,
} from '@/features/scraps/scraps.domain'

const slug = z
  .string()
  .trim()
  .refine(
    isValidScrapSlug,
    'Use lowercase letters, numbers, and hyphens, up to 80 characters.',
  )
const locale = z.enum(CONTENT_LOCALES)
const version = z.string().min(1)
const metadata = {
  title: z.string().trim().min(1),
  hypothesis: z.string().trim().min(1),
  summary: z.string().trim(),
  tags: z
    .array(z.string().trim().min(1))
    .transform((tags) => [...new Set(tags)]),
  status: z.enum(SCRAP_STATUSES),
  published: z.boolean(),
  lead: z
    .string()
    .refine((value) => value.trim().length > 0, 'Lead is required'),
}
const entry = {
  entryId: z.string().refine(isValidScrapEntryId),
  entryKind: z.enum(SCRAP_ENTRY_KINDS),
  body: z
    .string()
    .refine((value) => value.trim().length > 0, 'Entry body is required'),
  published: z.boolean(),
}

export const ScrapEditorCommandSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('create'), slug, locale, ...metadata }),
  z.object({
    kind: z.literal('update'),
    slug,
    locale,
    expectedVersion: version,
    ...metadata,
  }),
  z.object({
    kind: z.literal('append'),
    slug,
    locale,
    expectedVersion: version,
    ...entry,
  }),
  z.object({
    kind: z.literal('edit-entry'),
    slug,
    locale,
    expectedVersion: version,
    ...entry,
  }),
])

export type ScrapEditorCommand = z.infer<typeof ScrapEditorCommandSchema>
