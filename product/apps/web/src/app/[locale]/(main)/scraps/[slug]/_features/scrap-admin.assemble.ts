import { z } from 'zod'
import {
  CONTENT_LOCALES,
  isValidScrapEntryId,
  isValidScrapSlug,
  SCRAP_ENTRY_KINDS,
  type ContentLocale,
  type LocalizedDocumentRef,
  buildLocalizedEntryPathname,
} from '../../_features/scraps.domain'
import {
  applyScrapIndexProjectionDelta,
  loadScrapEntryMeta,
  loadScrapIndex,
  loadScrapManifest,
  saveScrapEntryDocument,
  saveScrapEntryMeta,
  saveScrapIndexProjection,
  saveScrapManifest,
} from '../../_features/scraps.infra'
import {
  planScrapEntryRevalidation,
} from '../../_features/scraps.revalidate.infra'

const localeSchema = z.enum(CONTENT_LOCALES)
const entryKindSchema = z.enum(SCRAP_ENTRY_KINDS)

export const AppendScrapEntryInputSchema = z.object({
  locale: localeSchema,
  uiLocale: z.string().trim().min(1).optional(),
  scrapSlug: z
    .string()
    .trim()
    .refine(isValidScrapSlug, { message: 'invalid scrap slug' }),
  entryId: z
    .string()
    .trim()
    .refine(isValidScrapEntryId, { message: 'invalid entry id' }),
  kind: entryKindSchema,
  body: z.string().min(1, 'entry body is required'),
})

export const EditScrapEntryInputSchema = z.object({
  locale: localeSchema,
  uiLocale: z.string().trim().min(1).optional(),
  scrapSlug: z
    .string()
    .trim()
    .refine(isValidScrapSlug, { message: 'invalid scrap slug' }),
  entryId: z
    .string()
    .trim()
    .refine(isValidScrapEntryId, { message: 'invalid entry id' }),
  body: z.string().min(1, 'entry body is required'),
})

export type AppendScrapEntryInput = z.infer<typeof AppendScrapEntryInputSchema>
export type EditScrapEntryInput = z.infer<typeof EditScrapEntryInputSchema>

export function parseAppendScrapEntryInput(payload: unknown) {
  return AppendScrapEntryInputSchema.safeParse(payload)
}

export function parseEditScrapEntryInput(payload: unknown) {
  return EditScrapEntryInputSchema.safeParse(payload)
}

function nowIso() {
  return new Date().toISOString()
}

function buildEntryDocumentRef(
  scrapSlug: string,
  entryId: string,
  locale: ContentLocale,
  state: LocalizedDocumentRef['state'],
): LocalizedDocumentRef {
  return {
    locale,
    state,
    pathname: buildLocalizedEntryPathname(scrapSlug, entryId, locale),
    reviewedAt: nowIso(),
  }
}

export async function applyAppendScrapEntry(input: AppendScrapEntryInput) {
  const loadedManifest = await loadScrapManifest(input.scrapSlug)
  if (!loadedManifest) {
    throw new Error(`Scrap not found: ${input.scrapSlug}`)
  }

  const { manifest } = loadedManifest

  if (manifest.entryIds.includes(input.entryId)) {
    throw new Error(
      `Entry id already exists: ${input.scrapSlug}/${input.entryId}`,
    )
  }

  const refState: LocalizedDocumentRef['state'] =
    input.locale === manifest.primaryLocale ? 'original' : 'manual'
  const documentRef = buildEntryDocumentRef(
    input.scrapSlug,
    input.entryId,
    input.locale,
    refState,
  )

  await saveScrapEntryDocument(
    input.scrapSlug,
    input.entryId,
    input.locale,
    input.body,
  )

  const createdAt = nowIso()
  await saveScrapEntryMeta({
    id: input.entryId,
    scrapSlug: input.scrapSlug,
    kind: input.kind,
    createdAt,
    published: true,
    documents: [documentRef],
  })

  const nextManifest = {
    ...manifest,
    entryIds: [...manifest.entryIds, input.entryId],
    updatedAt: createdAt,
  }
  await saveScrapManifest(nextManifest)

  const projection = await loadScrapIndex()
  const nextProjection = applyScrapIndexProjectionDelta(
    projection,
    nextManifest,
  )
  await saveScrapIndexProjection(nextProjection)

  return planScrapEntryRevalidation(input.scrapSlug, input.entryId)
}

export async function applyEditScrapEntry(input: EditScrapEntryInput) {
  const loadedManifest = await loadScrapManifest(input.scrapSlug)
  if (!loadedManifest) {
    throw new Error(`Scrap not found: ${input.scrapSlug}`)
  }
  const loadedEntry = await loadScrapEntryMeta(input.scrapSlug, input.entryId)
  if (!loadedEntry) {
    throw new Error(`Entry not found: ${input.scrapSlug}/${input.entryId}`)
  }

  const refState: LocalizedDocumentRef['state'] =
    input.locale === loadedManifest.manifest.primaryLocale
      ? 'original'
      : 'manual'

  const pathname = buildLocalizedEntryPathname(
    input.scrapSlug,
    input.entryId,
    input.locale,
  )
  await saveScrapEntryDocument(
    input.scrapSlug,
    input.entryId,
    input.locale,
    input.body,
  )

  const updatedAt = nowIso()
  const otherDocs = loadedEntry.meta.documents.filter(
    (doc) => doc.locale !== input.locale,
  )
  const nextMeta = {
    ...loadedEntry.meta,
    updatedAt,
    documents: [
      ...otherDocs,
      {
        locale: input.locale,
        pathname,
        state: refState,
        reviewedAt: updatedAt,
      } satisfies LocalizedDocumentRef,
    ],
  }
  await saveScrapEntryMeta(nextMeta)

  const nextManifest = {
    ...loadedManifest.manifest,
    updatedAt,
  }
  await saveScrapManifest(nextManifest)

  const projection = await loadScrapIndex()
  const nextProjection = applyScrapIndexProjectionDelta(
    projection,
    nextManifest,
  )
  await saveScrapIndexProjection(nextProjection)

  return planScrapEntryRevalidation(input.scrapSlug, input.entryId)
}
