import { z } from 'zod'
import {
  CONTENT_LOCALES,
  CONTENT_RELATION_KINDS,
  CONTENT_RELATION_TYPES,
  SCRAP_ENTRY_KINDS,
  SCRAP_STATUSES,
  TRANSLATION_STATES,
  type ContentLocale,
  type ScrapEntryMeta,
  type ScrapIndexEntry,
  type ScrapIndexProjection,
  type ScrapManifest,
} from './scraps.domain'

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/
const ENTRY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

const SlugSchema = z.string().regex(SLUG_PATTERN, {
  message:
    'slug must be lowercase ASCII, may contain digits and dashes, length 1-80',
})

const EntryIdSchema = z.string().regex(ENTRY_ID_PATTERN, {
  message:
    'entry id must be lowercase ASCII, may contain digits and dashes, length 1-80',
})

const LocaleSchema = z.enum(CONTENT_LOCALES)
const TranslationStateSchema = z.enum(TRANSLATION_STATES)
const StatusSchema = z.enum(SCRAP_STATUSES)
const EntryKindSchema = z.enum(SCRAP_ENTRY_KINDS)
const RelationKindSchema = z.enum(CONTENT_RELATION_KINDS)
const RelationTypeSchema = z.enum(CONTENT_RELATION_TYPES)
const TagsSchema = z
  .array(z.string().trim().min(1))
  .default([])
  .transform((tags) => [...new Set(tags.map((tag) => tag.trim()))])

const IsoDateSchema = z
  .string()
  .refine(
    (value) => !Number.isNaN(new Date(value).getTime()),
    'invalid ISO date',
  )

const LocalizedDocumentRefSchema = z.object({
  locale: LocaleSchema,
  pathname: z.string().trim().min(1),
  state: TranslationStateSchema,
  sourceVersion: z.string().trim().min(1).optional(),
  reviewedAt: IsoDateSchema.optional(),
})

const ContentRelationSchema = z.object({
  kind: RelationKindSchema,
  relation: RelationTypeSchema,
  href: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
})

export const ScrapManifestSchema = z
  .object({
    id: z.string().trim().min(1),
    slug: SlugSchema,
    title: z.string().trim().min(1),
    hypothesis: z.string().trim().min(1),
    summary: z.string().trim().min(1).optional(),
    status: StatusSchema,
    tags: TagsSchema,
    createdAt: IsoDateSchema,
    updatedAt: IsoDateSchema,
    published: z.boolean(),
    primaryLocale: LocaleSchema,
    lead: z.array(LocalizedDocumentRefSchema).default([]),
    entryIds: z.array(EntryIdSchema).default([]),
    outcomes: z.array(ContentRelationSchema).optional(),
  })
  .superRefine((manifest, ctx) => {
    if (
      new Date(manifest.updatedAt).getTime() <
      new Date(manifest.createdAt).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'updatedAt must not be earlier than createdAt',
        path: ['updatedAt'],
      })
    }

    if (
      manifest.lead.length > 0 &&
      !manifest.lead.some((ref) => ref.locale === manifest.primaryLocale)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'lead documents must include primaryLocale variant',
        path: ['lead'],
      })
    }

    const seenLeadLocales = new Set<ContentLocale>()
    for (const ref of manifest.lead) {
      if (seenLeadLocales.has(ref.locale)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate lead locale: ${ref.locale}`,
          path: ['lead'],
        })
      }
      seenLeadLocales.add(ref.locale)
    }

    const entryIdSet = new Set<string>()
    for (const entryId of manifest.entryIds) {
      if (entryIdSet.has(entryId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate entry id: ${entryId}`,
          path: ['entryIds'],
        })
      }
      entryIdSet.add(entryId)
    }
  })

export const ScrapEntryMetaSchema = z
  .object({
    id: EntryIdSchema,
    scrapSlug: SlugSchema,
    kind: EntryKindSchema,
    createdAt: IsoDateSchema,
    updatedAt: IsoDateSchema.optional(),
    published: z.boolean(),
    documents: z.array(LocalizedDocumentRefSchema).min(1),
  })
  .superRefine((entry, ctx) => {
    if (entry.updatedAt) {
      if (
        new Date(entry.updatedAt).getTime() <
        new Date(entry.createdAt).getTime()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'updatedAt must not be earlier than createdAt',
          path: ['updatedAt'],
        })
      }
    }

    const seenLocales = new Set<ContentLocale>()
    for (const ref of entry.documents) {
      if (seenLocales.has(ref.locale)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate entry locale: ${ref.locale}`,
          path: ['documents'],
        })
      }
      seenLocales.add(ref.locale)
    }
  })

const ScrapIndexLeadSummarySchema = z.object({
  locale: LocaleSchema,
  state: TranslationStateSchema,
})

export const ScrapIndexEntrySchema = z.object({
  slug: SlugSchema,
  title: z.string().trim().min(1),
  hypothesis: z.string().trim().min(1),
  summary: z.string().trim().min(1).optional(),
  status: StatusSchema,
  tags: z.array(z.string().trim().min(1)).default([]),
  createdAt: IsoDateSchema,
  updatedAt: IsoDateSchema,
  published: z.boolean(),
  primaryLocale: LocaleSchema,
  lead: z.array(ScrapIndexLeadSummarySchema).default([]),
  indexableLocales: z.array(LocaleSchema).default([]),
  entryCount: z.number().int().nonnegative(),
  hasOutcomes: z.boolean().default(false),
})

export const ScrapIndexProjectionSchema = z
  .array(ScrapIndexEntrySchema)
  .superRefine((entries, ctx) => {
    const seenSlugs = new Set<string>()
    for (const entry of entries) {
      if (seenSlugs.has(entry.slug)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate scrap slug in index: ${entry.slug}`,
        })
      }
      seenSlugs.add(entry.slug)
    }
  })

export function parseScrapManifest(raw: unknown): ScrapManifest {
  return ScrapManifestSchema.parse(raw) satisfies ScrapManifest
}

export function parseScrapEntryMeta(raw: unknown): ScrapEntryMeta {
  return ScrapEntryMetaSchema.parse(raw) satisfies ScrapEntryMeta
}

export function parseScrapIndexProjection(raw: unknown): ScrapIndexProjection {
  return ScrapIndexProjectionSchema.parse(raw) satisfies ScrapIndexProjection
}

export function parseScrapIndexEntry(raw: unknown): ScrapIndexEntry {
  return ScrapIndexEntrySchema.parse(raw) satisfies ScrapIndexEntry
}
