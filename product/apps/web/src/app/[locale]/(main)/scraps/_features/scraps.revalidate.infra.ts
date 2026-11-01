import type { RevalidatePathTarget } from '@/lib/content-store/content-store.domain'
import {
  SCRAPS_INDEX_CONTENT_TAG,
  getScrapContentTag,
  getScrapEntryContentTag,
} from '@/lib/content-store/content-tags.infra'

export const SCRAPS_INDEX_TAG = SCRAPS_INDEX_CONTENT_TAG

export { getScrapContentTag, getScrapEntryContentTag }

const LOCALE_REVALIDATE_PREFIXES = ['/ja', '/en'] as const

export function getLocalizedScrapListPaths(): readonly RevalidatePathTarget[] {
  return LOCALE_REVALIDATE_PREFIXES.map((locale) => ({
    path: `${locale}/scraps`,
  }))
}

export function getLocalizedScrapDetailPaths(
  slug: string,
): readonly RevalidatePathTarget[] {
  return LOCALE_REVALIDATE_PREFIXES.map((locale) => ({
    path: `${locale}/scraps/${slug}`,
  }))
}

export const SCRAPS_PUBLIC_ROUTE_TEMPLATES = LOCALE_REVALIDATE_PREFIXES.flatMap(
  (locale) => [`${locale}/scraps`, `${locale}/scraps/[slug]`],
) as readonly string[]

/**
 * Compute the tag + path set that must be invalidated when a single scrap
 * entry is appended or edited.
 */
export function planScrapEntryRevalidation(slug: string, entryId: string) {
  return {
    tags: [
      SCRAPS_INDEX_TAG,
      getScrapContentTag(slug),
      getScrapEntryContentTag(slug, entryId),
    ] as readonly string[],
    paths: [
      ...getLocalizedScrapListPaths(),
      ...getLocalizedScrapDetailPaths(slug),
    ] as readonly RevalidatePathTarget[],
  }
}

export function planScrapManifestRevalidation(slug: string) {
  return {
    tags: [SCRAPS_INDEX_TAG, getScrapContentTag(slug)] as readonly string[],
    paths: [
      ...getLocalizedScrapListPaths(),
      ...getLocalizedScrapDetailPaths(slug),
    ] as readonly RevalidatePathTarget[],
  }
}

export function planScrapArchiveRevalidation(slug: string) {
  // Archive removes the scrap from public surfaces, but its data persists for
  // admin / editor context. Revalidate the same surfaces as a manifest update
  // so the list page and detail page reflect the new status (the detail page
  // becomes 404 for public via static params regeneration, which only takes
  // effect on the next build).
  return planScrapManifestRevalidation(slug)
}
