import {
  type ContentLocale,
  type LocalizedDocumentRef,
  type ScrapManifest,
  getScrapStoragePaths,
  isValidScrapSlug,
  projectScrapIndexEntry,
  compareScrapsByUpdatedAtDesc,
  isIndexableTranslationState,
} from '@/features/scraps/scraps.domain'
import {
  parseScrapManifest,
  parseScrapEntryMeta,
  parseScrapIndexProjection,
} from '@/features/scraps/scraps.validation'
import { getScrapsAggregateRepository } from '@/features/scraps/scraps.infra'
import {
  type AggregateContentRepository,
  type ContentSnapshot,
  type ContentWrite,
  StorageError,
  StorageVersionConflictError,
} from '@/lib/content-store/content-store.domain'
import { createContentVersion } from '@/lib/content-store/content-version.infra'
import { SCRAPS_INDEX_PATHNAME } from '@/lib/content-store/content-tags.infra'
import {
  type ScrapEditorCommand,
  ScrapEditorCommandSchema,
} from './scrap-editor.validation'

async function readManifest(snapshot: ContentSnapshot, slug: string) {
  if (!isValidScrapSlug(slug)) throw new StorageError('Invalid scrap slug')
  const file = await snapshot.loadText(getScrapStoragePaths(slug).manifest)
  if (!file) return null
  const manifest = parseScrapManifest(JSON.parse(file.content))
  if (manifest.slug !== slug) throw new StorageError('Scrap identity mismatch')
  return manifest
}

async function readIndex(snapshot: ContentSnapshot) {
  const file = await snapshot.loadText(SCRAPS_INDEX_PATHNAME)
  return file ? parseScrapIndexProjection(JSON.parse(file.content)) : []
}

export async function loadScrapEditorIndex(
  repo: AggregateContentRepository = getScrapsAggregateRepository(),
) {
  return readIndex(await repo.snapshot())
}

export async function loadScrapEditorIndexState() {
  const snapshot = await getScrapsAggregateRepository().snapshot()
  const collection = await readIndex(snapshot)
  return {
    collection,
    serialized: JSON.stringify(collection, null, 2),
    version: snapshot.version,
  }
}

async function readDocuments(
  snapshot: ContentSnapshot,
  refs: LocalizedDocumentRef[],
  expectedPath: (locale: ContentLocale) => string,
) {
  return Promise.all(
    refs.map(async (ref) => {
      if (ref.pathname !== expectedPath(ref.locale))
        throw new StorageError('Scrap document path mismatch')
      const file = await snapshot.loadText(ref.pathname)
      if (!file && ref.state !== 'missing')
        throw new StorageError(`Missing scrap document: ${ref.pathname}`)
      return { ...ref, source: file?.content ?? '' }
    }),
  )
}

export async function loadScrapEditorState(
  slug: string,
  repo: AggregateContentRepository = getScrapsAggregateRepository(),
) {
  const snapshot = await repo.snapshot()
  const manifest = await readManifest(snapshot, slug)
  if (!manifest) return null
  const paths = getScrapStoragePaths(slug)
  const lead = await readDocuments(snapshot, manifest.lead, paths.lead)
  const entries = await Promise.all(
    manifest.entryIds.map(async (entryId) => {
      const file = await snapshot.loadText(paths.entryMeta(entryId))
      if (!file) throw new StorageError(`Missing entry: ${entryId}`)
      const meta = parseScrapEntryMeta(JSON.parse(file.content))
      if (meta.id !== entryId || meta.scrapSlug !== slug)
        throw new StorageError('Entry identity mismatch')
      const documents = await readDocuments(
        snapshot,
        meta.documents,
        (locale) => paths.entryDocument(entryId, locale),
      )
      return { meta, documents }
    }),
  )
  return { manifest, lead, entries, version: snapshot.version }
}

export type ScrapEditorState = NonNullable<
  Awaited<ReturnType<typeof loadScrapEditorState>>
>

function reviseDocuments(input: {
  refs: LocalizedDocumentRef[]
  locale: ContentLocale
  primaryLocale: ContentLocale
  pathname: string
  body: string
  sourceBody: string
  changed: boolean
  now: string
}) {
  const {
    refs,
    locale,
    primaryLocale,
    pathname,
    body,
    sourceBody,
    changed,
    now,
  } = input
  const sourceVersion = createContentVersion(
    (locale === primaryLocale ? body : sourceBody).trimEnd(),
  )
  return [
    ...refs
      .filter((ref) => ref.locale !== locale)
      .map((ref) =>
        locale === primaryLocale && changed && ref.locale !== primaryLocale
          ? { ...ref, state: 'stale' as const }
          : ref,
      ),
    {
      locale,
      pathname,
      state:
        locale === primaryLocale ? ('original' as const) : ('manual' as const),
      sourceVersion,
      reviewedAt: now,
    },
  ]
}

function jsonWrite(pathname: string, value: unknown): ContentWrite {
  return { pathname, content: `${JSON.stringify(value, null, 2)}\n` }
}

export async function executeScrapEditorCommand(
  command: ScrapEditorCommand,
  repo: AggregateContentRepository = getScrapsAggregateRepository(),
) {
  const input = ScrapEditorCommandSchema.parse(command)
  const snapshot = await repo.snapshot()
  if (input.kind !== 'create' && snapshot.version !== input.expectedVersion) {
    throw new StorageVersionConflictError(
      'Content changed. Your draft is still here. Copy it before loading the latest version.',
    )
  }
  const existing = await readManifest(snapshot, input.slug)
  const paths = getScrapStoragePaths(input.slug)
  const now = new Date().toISOString()
  const writes: ContentWrite[] = []
  let manifest: ScrapManifest

  if (input.kind === 'create') {
    if (existing)
      throw new StorageVersionConflictError(
        'That scrap slug already exists. Your draft has been kept.',
      )
    manifest = parseScrapManifest({
      id: input.slug,
      slug: input.slug,
      title: input.title,
      hypothesis: input.hypothesis,
      summary: input.summary || undefined,
      tags: input.tags,
      status: input.status,
      published: input.published,
      createdAt: now,
      updatedAt: now,
      primaryLocale: input.locale,
      entryIds: [],
      lead: reviseDocuments({
        refs: [],
        locale: input.locale,
        primaryLocale: input.locale,
        pathname: paths.lead(input.locale),
        body: input.lead,
        sourceBody: input.lead,
        changed: true,
        now,
      }),
    })
    writes.push({ pathname: paths.lead(input.locale), content: input.lead })
  } else {
    if (!existing) throw new StorageError('Scrap not found')
    manifest = { ...existing, updatedAt: now }
    if (input.kind === 'update') {
      const current = await snapshot.loadText(paths.lead(input.locale))
      const source = await snapshot.loadText(paths.lead(existing.primaryLocale))
      if (input.locale !== existing.primaryLocale && !source)
        throw new StorageError(
          'Save the original lead before adding a translation',
        )
      manifest = parseScrapManifest({
        ...manifest,
        title: input.title,
        hypothesis: input.hypothesis,
        summary: input.summary || undefined,
        tags: input.tags,
        status: input.status,
        published: input.published,
        lead: reviseDocuments({
          refs: existing.lead,
          locale: input.locale,
          primaryLocale: existing.primaryLocale,
          pathname: paths.lead(input.locale),
          body: input.lead,
          sourceBody: source?.content ?? input.lead,
          changed: current?.content.trimEnd() !== input.lead.trimEnd(),
          now,
        }),
      })
      writes.push({ pathname: paths.lead(input.locale), content: input.lead })
    } else {
      const metaFile = await snapshot.loadText(paths.entryMeta(input.entryId))
      if (
        input.kind === 'append' &&
        (metaFile || existing.entryIds.includes(input.entryId))
      ) {
        throw new StorageVersionConflictError(
          'Entry already exists. Your draft has been kept.',
        )
      }
      if (
        input.kind === 'edit-entry' &&
        (!metaFile || !existing.entryIds.includes(input.entryId))
      )
        throw new StorageError('Entry not found')
      if (input.kind === 'append' && input.locale !== existing.primaryLocale)
        throw new StorageError(
          'Create entries in the original language before adding translations',
        )
      const previous = metaFile
        ? parseScrapEntryMeta(JSON.parse(metaFile.content))
        : null
      if (
        previous &&
        (previous.id !== input.entryId || previous.scrapSlug !== input.slug)
      )
        throw new StorageError('Entry identity mismatch')
      const current = await snapshot.loadText(
        paths.entryDocument(input.entryId, input.locale),
      )
      const source = await snapshot.loadText(
        paths.entryDocument(input.entryId, existing.primaryLocale),
      )
      if (input.locale !== existing.primaryLocale && !source)
        throw new StorageError('Original entry is missing')
      const meta = parseScrapEntryMeta({
        id: input.entryId,
        scrapSlug: input.slug,
        kind: input.entryKind,
        published: input.published,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        documents: reviseDocuments({
          refs: previous?.documents ?? [],
          locale: input.locale,
          primaryLocale: existing.primaryLocale,
          pathname: paths.entryDocument(input.entryId, input.locale),
          body: input.body,
          sourceBody: source?.content ?? input.body,
          changed: current?.content.trimEnd() !== input.body.trimEnd(),
          now,
        }),
      })
      writes.push(jsonWrite(paths.entryMeta(input.entryId), meta), {
        pathname: paths.entryDocument(input.entryId, input.locale),
        content: input.body,
      })
      if (input.kind === 'append')
        manifest.entryIds = [...existing.entryIds, input.entryId]
    }
  }
  const index = await readIndex(snapshot)
  const nextEntry = projectScrapIndexEntry(manifest)
  for (const entryId of manifest.entryIds) {
    const pathname = paths.entryMeta(entryId)
    const updated = writes.find((write) => write.pathname === pathname)
    const file = updated ?? (await snapshot.loadText(pathname))
    if (!file) throw new StorageError(`Missing entry: ${entryId}`)
    const meta = parseScrapEntryMeta(JSON.parse(file.content))
    if (meta.published)
      nextEntry.indexableLocales = nextEntry.indexableLocales.filter((locale) =>
        meta.documents.some(
          (ref) =>
            ref.locale === locale && isIndexableTranslationState(ref.state),
        ),
      )
  }
  const nextIndex = [
    nextEntry,
    ...index.filter((item) => item.slug !== input.slug),
  ].sort(compareScrapsByUpdatedAtDesc)
  writes.push(
    jsonWrite(paths.manifest, manifest),
    jsonWrite(SCRAPS_INDEX_PATHNAME, nextIndex),
  )
  const version = await repo.commit(
    snapshot.version,
    writes,
    `${input.kind} scrap ${input.slug}`,
  )
  return { version, slug: input.slug }
}
