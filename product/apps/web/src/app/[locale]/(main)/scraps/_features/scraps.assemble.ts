import { cache } from 'react'
import { BASE_URL, getAbsoluteUrl } from '@/config/site'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import type { ContentSnapshot } from '@/lib/content-store/content-store.domain'
import {
  CONTENT_LOCALES,
  type ContentLocale,
  type ScrapEntryMeta,
  type ScrapIndexEntry,
  type ScrapIndexProjection,
  type ScrapManifest,
  compareScrapEntryMetaByCreatedAtAsc,
  compareScrapsByUpdatedAtDesc,
  getIndexableLocaleVariants,
  isPublicScrap,
  isIndexableTranslationState,
  resolveLocalizedDocumentRef,
} from '@/features/scraps/scraps.domain'
import {
  getScrapsAggregateRepository,
  loadScrapEntryDocuments,
  loadScrapEntryMeta,
  loadScrapIndex,
  loadScrapManifest,
  loadScrapMdxDocument,
} from '@/features/scraps/scraps.infra'

export type ScrapListAudience = 'public' | 'admin'

export type ScrapListItem = ScrapIndexEntry

export function filterPublicScrapIndex(
  projection: ScrapIndexProjection,
): ScrapIndexProjection {
  return projection
    .filter((entry) => isPublicScrap(entry))
    .sort(compareScrapsByUpdatedAtDesc)
}

export function getPublicScrapStaticParams(
  projection: ScrapIndexProjection,
): Array<{ slug: string }> {
  return filterPublicScrapIndex(projection).map((entry) => ({
    slug: entry.slug,
  }))
}

export const loadScrapIndexCached = cache(async () => {
  return loadScrapIndex()
})

export const loadPublicScraps = cache(async () => {
  const projection = await loadScrapIndexCached()
  return filterPublicScrapIndex(projection)
})

export async function getScrapStaticParams() {
  const projection = await loadScrapIndexCached()
  return getPublicScrapStaticParams(projection)
}

export type AssembledScrapEntry = {
  meta: ScrapEntryMeta
  localizedSource: string | null
  localizedState: 'rendered' | 'fallback' | 'missing'
  renderedLocale: ContentLocale | null
}

export type AssembledScrapPage = {
  manifest: ScrapManifest
  /** lead document for the resolved locale (may be a fallback) */
  leadSource: string | null
  leadState: 'rendered' | 'fallback' | 'missing'
  leadLocale: ContentLocale | null
  entries: AssembledScrapEntry[]
  indexableLocales: ContentLocale[]
  /** locale alternates that are safe to expose to search engines */
  alternateLocales: ContentLocale[]
  /** true when the resolved page mixes only indexable variants */
  pageIsIndexable: boolean
}

function resolveContentLocale(value: string): ContentLocale {
  return value === 'en' ? 'en' : 'ja'
}

async function assembleEntry(
  meta: ScrapEntryMeta,
  requestedLocale: ContentLocale,
  primaryLocale: ContentLocale,
  audience: ScrapListAudience,
  snapshot: ContentSnapshot,
): Promise<AssembledScrapEntry> {
  const resolved = resolveLocalizedDocumentRef({
    refs: meta.documents,
    requestedLocale,
    primaryLocale,
    audience,
  })

  if (!resolved) {
    return {
      meta,
      localizedSource: null,
      localizedState: 'missing',
      renderedLocale: null,
    }
  }

  const loaded = await loadScrapMdxDocument(resolved, snapshot)
  if (!loaded) {
    return {
      meta,
      localizedSource: null,
      localizedState: 'missing',
      renderedLocale: null,
    }
  }

  return {
    meta,
    localizedSource: loaded.source,
    localizedState:
      resolved.locale === requestedLocale ? 'rendered' : 'fallback',
    renderedLocale: resolved.locale,
  }
}

export async function assembleScrapPage(params: {
  slug: string
  locale: string
  audience: ScrapListAudience
}): Promise<AssembledScrapPage | null> {
  const requestedLocale = resolveContentLocale(params.locale)
  const snapshot = await getScrapsAggregateRepository().snapshot()
  const loadedManifest = await loadScrapManifest(params.slug, snapshot)
  if (!loadedManifest) {
    return null
  }
  const { manifest } = loadedManifest

  if (params.audience === 'public' && !isPublicScrap(manifest)) {
    return null
  }

  const leadRef = resolveLocalizedDocumentRef({
    refs: manifest.lead,
    requestedLocale,
    primaryLocale: manifest.primaryLocale,
    audience: params.audience,
  })

  let leadSource: string | null = null
  let leadState: AssembledScrapPage['leadState'] = 'missing'
  let leadLocale: ContentLocale | null = null

  if (leadRef) {
    const loadedLead = await loadScrapMdxDocument(leadRef, snapshot)
    if (loadedLead) {
      leadSource = loadedLead.source
      leadState = leadRef.locale === requestedLocale ? 'rendered' : 'fallback'
      leadLocale = leadRef.locale
    }
  }

  const entries: AssembledScrapEntry[] = []
  for (const entryId of manifest.entryIds) {
    const loadedEntry = await loadScrapEntryMeta(
      manifest.slug,
      entryId,
      snapshot,
    )
    if (!loadedEntry) {
      continue
    }
    if (params.audience === 'public' && !loadedEntry.meta.published) {
      continue
    }
    entries.push(
      await assembleEntry(
        loadedEntry.meta,
        requestedLocale,
        manifest.primaryLocale,
        params.audience,
        snapshot,
      ),
    )
  }

  entries.sort((a, b) => compareScrapEntryMetaByCreatedAtAsc(a.meta, b.meta))

  const indexableLocales = getIndexableLocaleVariants(manifest.lead).filter(
    (locale) =>
      entries.every((entry) =>
        entry.meta.documents.some(
          (ref) =>
            ref.locale === locale && isIndexableTranslationState(ref.state),
        ),
      ),
  )
  const alternateLocales = indexableLocales

  const pageIsIndexable =
    params.audience === 'public' &&
    indexableLocales.includes(requestedLocale) &&
    leadSource !== null &&
    leadRef !== null &&
    isIndexableTranslationState(leadRef.state) &&
    entries.every((entry) => {
      if (entry.renderedLocale === null) {
        return false
      }
      const ref = entry.meta.documents.find(
        (candidate) => candidate.locale === entry.renderedLocale,
      )
      return ref ? isIndexableTranslationState(ref.state) : false
    })

  return {
    manifest,
    leadSource,
    leadState,
    leadLocale,
    entries,
    indexableLocales,
    alternateLocales,
    pageIsIndexable,
  }
}

export async function loadEntryDocumentsForAdmin(meta: ScrapEntryMeta) {
  const snapshot = await getScrapsAggregateRepository().snapshot()
  return loadScrapEntryDocuments(meta, snapshot)
}

export const buildScrapListUrl = (locale: string) =>
  `${BASE_URL}${buildLocalizedUrl('/scraps', locale)}`

export const buildScrapDetailUrl = (slug: string, locale: string) =>
  `${BASE_URL}${buildLocalizedUrl(`/scraps/${slug}`, locale)}`

export function buildScrapAlternateLanguages(
  slug: string,
  indexableLocales: readonly ContentLocale[],
) {
  return Object.fromEntries(
    indexableLocales.map((locale) => [
      locale,
      getAbsoluteUrl(buildLocalizedUrl(`/scraps/${slug}`, locale)),
    ]),
  )
}

export function buildScrapListAlternateLanguages() {
  return Object.fromEntries(
    CONTENT_LOCALES.map((locale) => [
      locale,
      getAbsoluteUrl(buildLocalizedUrl('/scraps', locale)),
    ]),
  )
}
