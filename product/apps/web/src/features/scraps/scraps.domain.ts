export const CONTENT_LOCALES = ['ja', 'en'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

export const SCRAP_STATUSES = ['open', 'closed', 'archived'] as const
export type ScrapStatus = (typeof SCRAP_STATUSES)[number]

export const TRANSLATION_STATES = [
  'original',
  'manual',
  'machine-draft',
  'stale',
  'missing',
] as const
export type TranslationState = (typeof TRANSLATION_STATES)[number]

export const SCRAP_ENTRY_KINDS = [
  'note',
  'evidence',
  'experiment',
  'decision',
  'todo',
  'summary',
] as const
export type ScrapEntryKind = (typeof SCRAP_ENTRY_KINDS)[number]

export const CONTENT_RELATION_KINDS = [
  'blog',
  'note',
  'external',
  'repo',
  'issue',
] as const
export type ContentRelationKind = (typeof CONTENT_RELATION_KINDS)[number]

export const CONTENT_RELATION_TYPES = [
  'derived-into',
  'expanded-into',
  'contradicted-by',
  'summarized-by',
  'implemented-by',
] as const
export type ContentRelationType = (typeof CONTENT_RELATION_TYPES)[number]

/**
 * Translation states whose variants are safe to expose to search engines.
 *
 * Machine-drafted / stale / missing variants must never appear in
 * `sitemap.xml`, `alternates.languages`, or be marked `index,follow`.
 */
export const INDEXABLE_TRANSLATION_STATES: readonly TranslationState[] = [
  'original',
  'manual',
]

export function isIndexableTranslationState(value: TranslationState) {
  return (INDEXABLE_TRANSLATION_STATES as readonly string[]).includes(value)
}

export type LocalizedDocumentRef = {
  locale: ContentLocale
  pathname: string
  state: TranslationState
  sourceVersion?: string
  reviewedAt?: string
}

export type ContentRelation = {
  kind: ContentRelationKind
  href?: string
  slug?: string
  title?: string
  relation: ContentRelationType
}

export type ScrapManifest = {
  id: string
  slug: string
  title: string
  hypothesis: string
  summary?: string
  status: ScrapStatus
  tags: string[]
  createdAt: string
  updatedAt: string
  published: boolean
  primaryLocale: ContentLocale
  lead: LocalizedDocumentRef[]
  entryIds: string[]
  outcomes?: ContentRelation[]
}

export type ScrapEntryMeta = {
  id: string
  scrapSlug: string
  kind: ScrapEntryKind
  createdAt: string
  updatedAt?: string
  published: boolean
  documents: LocalizedDocumentRef[]
}

export type ScrapIndexLeadSummary = {
  locale: ContentLocale
  state: TranslationState
}

export type ScrapIndexEntry = {
  slug: string
  title: string
  hypothesis: string
  summary?: string
  status: ScrapStatus
  tags: string[]
  createdAt: string
  updatedAt: string
  published: boolean
  primaryLocale: ContentLocale
  lead: ScrapIndexLeadSummary[]
  /** Locales whose lead variant is safe to expose to search engines. */
  indexableLocales: ContentLocale[]
  entryCount: number
  hasOutcomes: boolean
}

export type ScrapIndexProjection = ScrapIndexEntry[]

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/
const ENTRY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/

export function isValidScrapSlug(value: string) {
  return SLUG_PATTERN.test(value)
}

export function isValidScrapEntryId(value: string) {
  return ENTRY_ID_PATTERN.test(value)
}

export function isContentLocale(value: unknown): value is ContentLocale {
  return (
    typeof value === 'string' &&
    (CONTENT_LOCALES as readonly string[]).includes(value)
  )
}

export function getIndexableLocaleVariants(
  refs: readonly LocalizedDocumentRef[],
): ContentLocale[] {
  return refs
    .filter((ref) => isIndexableTranslationState(ref.state))
    .map((ref) => ref.locale)
}

/**
 * Resolve which localized document should be rendered for a requested locale.
 *
 * Public renderers should treat the returned `state` as:
 *   - `original` or `manual` → render directly
 *   - `machine-draft` → only render in admin context; mark noindex publicly
 *   - `stale` → render but treat as fallback (also noindex)
 *
 * If no suitable variant exists, `null` is returned.
 */
export function resolveLocalizedDocumentRef(params: {
  refs: readonly LocalizedDocumentRef[]
  requestedLocale: ContentLocale
  primaryLocale: ContentLocale
  audience: 'public' | 'admin'
}): LocalizedDocumentRef | null {
  const { refs, requestedLocale, primaryLocale, audience } = params

  const indexable = refs.find(
    (ref) =>
      ref.locale === requestedLocale && isIndexableTranslationState(ref.state),
  )

  if (indexable) {
    return indexable
  }

  if (audience === 'admin') {
    const adminVisible = refs.find((ref) => ref.locale === requestedLocale)
    if (adminVisible) {
      return adminVisible
    }
  }

  const primary = refs.find(
    (ref) =>
      ref.locale === primaryLocale && isIndexableTranslationState(ref.state),
  )
  if (primary) {
    return primary
  }

  if (audience === 'admin') {
    const primaryAdmin = refs.find((ref) => ref.locale === primaryLocale)
    if (primaryAdmin) {
      return primaryAdmin
    }
  }

  return null
}

/**
 * Whether a scrap is part of the public-facing surface (list page, sitemap,
 * static params, detail page).
 *
 * - `archived` is always excluded from public listings (and from
 *   `generateStaticParams`).
 * - `published === false` is always excluded from public surfaces.
 * - `closed` is public if `published === true`.
 */
export function isPublicScrap(scrap: {
  status: ScrapStatus
  published: boolean
}) {
  if (!scrap.published) {
    return false
  }

  if (scrap.status === 'archived') {
    return false
  }

  return true
}

export function compareScrapsByUpdatedAtDesc<
  T extends { updatedAt: string },
>(a: T, b: T) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
}

export function compareScrapEntryMetaByCreatedAtAsc<
  T extends { createdAt: string },
>(a: T, b: T) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

export function getBlogOutcomes(outcomes?: readonly ContentRelation[]) {
  return (outcomes ?? []).filter((relation) => relation.kind === 'blog')
}

/**
 * Build the storage pathnames for a scrap.
 */
export function getScrapStoragePaths(slug: string) {
  if (!isValidScrapSlug(slug)) {
    throw new Error(`Invalid scrap slug: ${slug}`)
  }

  return {
    manifest: `scraps/${slug}/manifest.json`,
    lead: (locale: ContentLocale) => `scraps/${slug}/lead.${locale}.mdx`,
    entryDirectory: (entryId: string) => `scraps/${slug}/entries/${entryId}`,
    entryMeta: (entryId: string) =>
      `scraps/${slug}/entries/${entryId}/meta.json`,
    entryDocument: (entryId: string, locale: ContentLocale) =>
      `scraps/${slug}/entries/${entryId}/entry.${locale}.mdx`,
  }
}

export function buildLocalizedLeadPathname(
  slug: string,
  locale: ContentLocale,
) {
  return getScrapStoragePaths(slug).lead(locale)
}

export function buildLocalizedEntryPathname(
  slug: string,
  entryId: string,
  locale: ContentLocale,
) {
  return getScrapStoragePaths(slug).entryDocument(entryId, locale)
}

export function projectScrapIndexEntry(
  manifest: ScrapManifest,
): ScrapIndexEntry {
  return {
    slug: manifest.slug,
    title: manifest.title,
    hypothesis: manifest.hypothesis,
    summary: manifest.summary,
    status: manifest.status,
    tags: [...manifest.tags],
    createdAt: manifest.createdAt,
    updatedAt: manifest.updatedAt,
    published: manifest.published,
    primaryLocale: manifest.primaryLocale,
    lead: manifest.lead.map((ref) => ({
      locale: ref.locale,
      state: ref.state,
    })),
    indexableLocales: getIndexableLocaleVariants(manifest.lead),
    entryCount: manifest.entryIds.length,
    hasOutcomes: Boolean(manifest.outcomes && manifest.outcomes.length > 0),
  }
}
