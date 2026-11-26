import { createContentVersion } from '@tenzyu/revisioned-content/version'
import {
  StorageError,
  type ContentRepository,
  type AggregateContentRepository,
  type ContentSnapshot,
} from '@tenzyu/revisioned-content/contracts'
import { githubContentRepository } from '@/platform/content-store/github-content.infra'
import { SCRAPS_INDEX_PATHNAME } from '@/config/content-cache'
import {
  type LocalizedDocumentRef,
  type ScrapEntryMeta,
  type ScrapIndexProjection,
  type ScrapManifest,
  compareScrapsByUpdatedAtDesc,
  getScrapStoragePaths,
  isValidScrapEntryId,
  isValidScrapSlug,
  projectScrapIndexEntry,
} from '@tenzyu/publishing-domain/scraps'
import {
  parseScrapEntryMeta,
  parseScrapIndexProjection,
  parseScrapManifest,
} from '@tenzyu/publishing-domain/scraps-validation'

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

export async function loadScrapIndex(
  snapshot: ContentSnapshot,
): Promise<ScrapIndexProjection> {
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
