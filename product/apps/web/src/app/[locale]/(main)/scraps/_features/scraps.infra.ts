import { createContentVersion } from '@/lib/content-store/content-version.infra'
import {
  StorageError,
  type ContentRepository,
  type AggregateContentRepository,
  type ContentSnapshot,
} from '@/lib/content-store/content-store.domain'
import { githubContentRepository } from '@/lib/content-store/github-content.infra'
import { SCRAPS_INDEX_PATHNAME } from '@/lib/content-store/content-tags.infra'
import {
  CONTENT_LOCALES,
  type ContentLocale,
  type LocalizedDocumentRef,
  type ScrapEntryMeta,
  type ScrapIndexProjection,
  type ScrapManifest,
  buildLocalizedEntryPathname,
  compareScrapsByUpdatedAtDesc,
  getScrapStoragePaths,
  isValidScrapEntryId,
  isValidScrapSlug,
  projectScrapIndexEntry,
} from './scraps.domain'
import {
  parseScrapEntryMeta,
  parseScrapIndexProjection,
  parseScrapManifest,
} from './scraps-parse.infra'

const SCRAPS_PREFIX = 'scraps/'

type ScrapsRepository = ContentRepository & Partial<AggregateContentRepository>

let repositoryOverride: ScrapsRepository | null = null

export function setScrapsRepositoryOverride(repo: ScrapsRepository | null) {
  repositoryOverride = repo
}

function getScrapsRepository(): ScrapsRepository {
  return repositoryOverride ?? githubContentRepository
}

export function getScrapsAggregateRepository(): AggregateContentRepository {
  const repo = getScrapsRepository()
  if (!repo.snapshot || !repo.commit) {
    throw new StorageError('Scraps require an atomic aggregate repository')
  }
  return { snapshot: repo.snapshot.bind(repo), commit: repo.commit.bind(repo) }
}

export type LoadedScrapEntry = {
  meta: ScrapEntryMeta
  metaVersion: string
}

export type LoadedScrapManifest = {
  manifest: ScrapManifest
  version: string
}

export type LoadedScrapDocument = {
  ref: LocalizedDocumentRef
  source: string
  version: string
}

function assertSlug(slug: string) {
  if (!isValidScrapSlug(slug)) {
    throw new StorageError(`Invalid scrap slug: ${slug}`)
  }
}

function assertEntryId(entryId: string) {
  if (!isValidScrapEntryId(entryId)) {
    throw new StorageError(`Invalid scrap entry id: ${entryId}`)
  }
}

export async function loadScrapIndex(): Promise<ScrapIndexProjection> {
  const snapshot = await getScrapsAggregateRepository().snapshot()
  const file = await snapshot.loadText(SCRAPS_INDEX_PATHNAME)
  if (!file) {
    return []
  }
  return parseScrapIndexProjection(JSON.parse(file.content))
}

export async function loadScrapManifest(
  slug: string,
  snapshot: ContentSnapshot,
): Promise<LoadedScrapManifest | null> {
  assertSlug(slug)
  const paths = getScrapStoragePaths(slug)
  const file = await snapshot.loadText(paths.manifest)
  if (!file) {
    return null
  }
  const manifest = parseScrapManifest(JSON.parse(file.content))
  return {
    manifest,
    version: file.version ?? createContentVersion(file.content.trimEnd()),
  }
}

export async function loadScrapEntryMeta(
  slug: string,
  entryId: string,
  snapshot: ContentSnapshot,
): Promise<LoadedScrapEntry | null> {
  assertSlug(slug)
  assertEntryId(entryId)
  const paths = getScrapStoragePaths(slug)
  const file = await snapshot.loadText(paths.entryMeta(entryId))
  if (!file) {
    return null
  }
  const meta = parseScrapEntryMeta(JSON.parse(file.content))
  return {
    meta,
    metaVersion: file.version ?? createContentVersion(file.content.trimEnd()),
  }
}

export async function loadScrapMdxDocument(
  ref: LocalizedDocumentRef,
  snapshot: ContentSnapshot,
): Promise<LoadedScrapDocument | null> {
  const file = await snapshot.loadText(ref.pathname)
  if (!file) {
    return null
  }
  return {
    ref,
    source: file.content,
    version: file.version ?? createContentVersion(file.content.trimEnd()),
  }
}

export async function loadScrapEntryDocuments(
  meta: ScrapEntryMeta,
  snapshot: ContentSnapshot,
): Promise<LoadedScrapDocument[]> {
  const documents = await Promise.all(
    meta.documents.map(async (ref) => loadScrapMdxDocument(ref, snapshot)),
  )
  return documents.filter((doc): doc is LoadedScrapDocument => doc !== null)
}

async function listManifestPathnames() {
  const repo = getScrapsRepository()
  const all = await repo.list(SCRAPS_PREFIX)
  return all.filter(
    (pathname) =>
      pathname.startsWith(SCRAPS_PREFIX) && pathname.endsWith('/manifest.json'),
  )
}

/**
 * Walk the GitHub content tree to rebuild the scraps index projection.
 *
 * Intended for repair / dev tooling. The normal write path calls
 * `applyScrapIndexProjectionDelta` which avoids re-listing the tree.
 */
export async function rebuildScrapIndexProjection() {
  const snapshot = await getScrapsAggregateRepository().snapshot()
  const manifestPathnames = await listManifestPathnames()
  const manifests = await Promise.all(
    manifestPathnames.map(async (pathname) => {
      const slug = pathname.slice(SCRAPS_PREFIX.length).split('/')[0]
      if (!slug) {
        return null
      }
      const loaded = await loadScrapManifest(slug, snapshot)
      return loaded?.manifest ?? null
    }),
  )

  return manifests
    .filter((manifest): manifest is ScrapManifest => manifest !== null)
    .map(projectScrapIndexEntry)
    .sort(compareScrapsByUpdatedAtDesc)
}

export async function saveScrapIndexProjection(
  projection: ScrapIndexProjection,
) {
  const repo = getScrapsRepository()
  parseScrapIndexProjection(projection)
  await repo.saveJson(SCRAPS_INDEX_PATHNAME, projection, {
    message: `Update scraps index`,
  })
}

export function applyScrapIndexProjectionDelta(
  projection: ScrapIndexProjection,
  manifest: ScrapManifest,
): ScrapIndexProjection {
  const nextEntry = projectScrapIndexEntry(manifest)
  const without = projection.filter((entry) => entry.slug !== manifest.slug)
  const next = [nextEntry, ...without]
  return next.sort(compareScrapsByUpdatedAtDesc)
}

export function removeFromScrapIndexProjection(
  projection: ScrapIndexProjection,
  slug: string,
): ScrapIndexProjection {
  return projection.filter((entry) => entry.slug !== slug)
}

export async function saveScrapManifest(manifest: ScrapManifest) {
  const repo = getScrapsRepository()
  const validated = parseScrapManifest(manifest)
  const paths = getScrapStoragePaths(validated.slug)
  await repo.saveJson(paths.manifest, validated, {
    message: `Update scrap manifest: ${validated.slug}`,
  })
}

export async function saveScrapLeadDocument(
  slug: string,
  ref: LocalizedDocumentRef,
  source: string,
) {
  assertSlug(slug)
  if (!CONTENT_LOCALES.includes(ref.locale)) {
    throw new StorageError(`Unsupported content locale: ${ref.locale}`)
  }
  const repo = getScrapsRepository()
  const expectedPath = getScrapStoragePaths(slug).lead(ref.locale)
  if (ref.pathname !== expectedPath) {
    throw new StorageError(
      `Lead pathname mismatch: expected ${expectedPath}, got ${ref.pathname}`,
    )
  }
  await repo.saveText(ref.pathname, source, {
    message: `Update scrap lead: ${slug} (${ref.locale})`,
  })
}

export async function saveScrapEntryMeta(meta: ScrapEntryMeta) {
  const repo = getScrapsRepository()
  const validated = parseScrapEntryMeta(meta)
  const paths = getScrapStoragePaths(validated.scrapSlug)
  await repo.saveJson(paths.entryMeta(validated.id), validated, {
    message: `Update scrap entry meta: ${validated.scrapSlug}/${validated.id}`,
  })
}

export async function saveScrapEntryDocument(
  slug: string,
  entryId: string,
  locale: ContentLocale,
  source: string,
) {
  assertSlug(slug)
  assertEntryId(entryId)
  const repo = getScrapsRepository()
  const pathname = buildLocalizedEntryPathname(slug, entryId, locale)
  await repo.saveText(pathname, source, {
    message: `Update scrap entry: ${slug}/${entryId} (${locale})`,
  })
  return { pathname }
}

export async function deleteScrapEntryDocuments(meta: ScrapEntryMeta) {
  const repo = getScrapsRepository()
  for (const ref of meta.documents) {
    await repo.delete(ref.pathname, {
      message: `Delete scrap entry document: ${ref.pathname}`,
    })
  }
  const paths = getScrapStoragePaths(meta.scrapSlug)
  await repo.delete(paths.entryMeta(meta.id), {
    message: `Delete scrap entry meta: ${meta.scrapSlug}/${meta.id}`,
  })
}
