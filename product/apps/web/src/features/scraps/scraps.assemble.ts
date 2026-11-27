import { cache } from 'react'
import { BASE_URL, getAbsoluteUrl } from '@/config/site'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import {
  type ContentSnapshot,
  StorageError,
} from '@tenzyu/revisioned-content/contracts'
import {
  CONTENT_LOCALES,
  type ContentLocale,
  type LocalizedDocumentRef,
  type ScrapEntryMeta,
  type ScrapIndexProjection,
  type ScrapManifest,
  compareScrapEntryMetaByCreatedAtAsc,
  compareScrapsByUpdatedAtDesc,
  getIndexableLocaleVariants,
  isPublicScrap,
  isIndexableTranslationState,
  isValidScrapSlug,
  resolveLocalizedDocumentRef,
} from '@tenzyu/publishing-domain/scraps'
import {
  loadScrapEntryMeta,
  loadScrapIndex,
  loadScrapManifest,
  loadScrapMdxDocument,
} from '@/features/scraps/scraps.infra'

export function filterPublicScrapIndex(
  projection: ScrapIndexProjection,
): ScrapIndexProjection {
  return projection
    .filter((entry) => isPublicScrap(entry))
    .sort(compareScrapsByUpdatedAtDesc)
}

export const loadPublicScraps = cache(async (snapshot: ContentSnapshot) =>
  filterPublicScrapIndex(await loadScrapIndex(snapshot)),
)

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
  /** true when the resolved page mixes only indexable variants */
  pageIsIndexable: boolean
}

async function loadPublicScrapSource(
  snapshot: ContentSnapshot,
  ref: LocalizedDocumentRef,
) {
  const document = await loadScrapMdxDocument(ref, snapshot)
  if (!document) throw new StorageError(`Missing Scrap source: ${ref.pathname}`)
  return document.source
}

async function assembleEntry(
  meta: ScrapEntryMeta,
  requestedLocale: ContentLocale,
  primaryLocale: ContentLocale,
  snapshot: ContentSnapshot,
): Promise<AssembledScrapEntry> {
  const resolved = resolveLocalizedDocumentRef({
    refs: meta.documents,
    requestedLocale,
    primaryLocale,
    audience: 'public',
  })

  if (!resolved) {
    return {
      meta,
      localizedSource: null,
      localizedState: 'missing',
      renderedLocale: null,
    }
  }

  return {
    meta,
    localizedSource: await loadPublicScrapSource(snapshot, resolved),
    localizedState:
      resolved.locale === requestedLocale ? 'rendered' : 'fallback',
    renderedLocale: resolved.locale,
  }
}

export const assembleScrapPage = cache(
  async (
    snapshot: ContentSnapshot,
    slug: string,
    locale: string,
  ): Promise<AssembledScrapPage | null> => {
    if (!isValidScrapSlug(slug)) return null
    const loadedManifest = await loadScrapManifest(slug, snapshot)
    if (!loadedManifest) {
      const listed = await loadPublicScraps(snapshot)
      if (listed.some((entry) => entry.slug === slug)) {
        throw new StorageError(`Missing manifest for listed Scrap: ${slug}`)
      }
      return null
    }
    const { manifest } = loadedManifest
    if (!isPublicScrap(manifest)) return null

    const requestedLocale = locale === 'en' ? 'en' : 'ja'
    const leadRef = resolveLocalizedDocumentRef({
      refs: manifest.lead,
      requestedLocale,
      primaryLocale: manifest.primaryLocale,
      audience: 'public',
    })
    const leadSource =
      leadRef && (await loadPublicScrapSource(snapshot, leadRef))

    const entries: AssembledScrapEntry[] = []
    for (const entryId of manifest.entryIds) {
      const loadedEntry = await loadScrapEntryMeta(
        manifest.slug,
        entryId,
        snapshot,
      )
      if (!loadedEntry) {
        throw new StorageError(
          `Missing Scrap entry metadata: ${slug}/${entryId}`,
        )
      }
      if (!loadedEntry.meta.published) continue
      entries.push(
        await assembleEntry(
          loadedEntry.meta,
          requestedLocale,
          manifest.primaryLocale,
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

    return {
      manifest,
      leadSource,
      leadState: leadRef
        ? leadRef.locale === requestedLocale
          ? 'rendered'
          : 'fallback'
        : 'missing',
      leadLocale: leadRef?.locale ?? null,
      entries,
      indexableLocales,
      pageIsIndexable: indexableLocales.includes(requestedLocale),
    }
  },
)

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
