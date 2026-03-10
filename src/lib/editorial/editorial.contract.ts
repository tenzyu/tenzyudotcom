import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseNoteSourceEntries } from '@/app/[locale]/(main)/notes/_features/notes.contract'
import { parseDashboardSourceCategories } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.contract'
import { parsePuzzleSourceCategories } from '@/app/[locale]/(main)/puzzles/_features/puzzles.contract'
import { parseRecommendationSourceEntries } from '@/app/[locale]/(main)/recommendations/_features/recommendations.contract'
import { env, isEditorialBlobStorage } from '@/config/env.contract'
import { parseLinkSourceEntries } from '@/features/links/links.contract'
import { get, put } from '@vercel/blob'
import type {
  EditorialCollectionData,
  EditorialCollectionId,
  EditorialRepository,
  EditorialState,
  RevalidatePathTarget,
} from './editorial.port'

const LOCAL_EDITORIAL_DIR = join(process.cwd(), 'storage', 'editorial')

export type EditorialCollectionDescriptor<K extends EditorialCollectionId> = {
  id: K
  label: string
  storagePath: string
  publicPaths: readonly RevalidatePathTarget[]
  getDefaultValue: () => EditorialCollectionData[K]
  parse: (raw: unknown) => EditorialCollectionData[K]
}

const LOCALE_PREFIXES = ['/ja', '/en'] as const

function withLocales(pathname: string) {
  return LOCALE_PREFIXES.map((locale) => ({
    path: `${locale}${pathname}`,
  })) satisfies readonly RevalidatePathTarget[]
}

export const EDITORIAL_COLLECTIONS: {
  [K in EditorialCollectionId]: EditorialCollectionDescriptor<K>
} = {
  recommendations: {
    id: 'recommendations',
    label: 'Recommendations',
    storagePath: 'recommendations.json',
    publicPaths: withLocales('/recommendations'),
    getDefaultValue: () => [],
    parse: parseRecommendationSourceEntries,
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    storagePath: 'notes.json',
    publicPaths: withLocales('/notes'),
    getDefaultValue: () => [],
    parse: parseNoteSourceEntries,
  },
  puzzles: {
    id: 'puzzles',
    label: 'Puzzles',
    storagePath: 'puzzles.json',
    publicPaths: withLocales('/puzzles'),
    getDefaultValue: () => [],
    parse: parsePuzzleSourceCategories,
  },
  pointers: {
    id: 'pointers',
    label: 'Pointers',
    storagePath: 'pointers.json',
    publicPaths: withLocales('/pointers'),
    getDefaultValue: () => [],
    parse: parseDashboardSourceCategories,
  },
  links: {
    id: 'links',
    label: 'Links',
    storagePath: 'links.json',
    publicPaths: [
      ...withLocales('/links'),
      ...LOCALE_PREFIXES.map((locale) => ({
        path: `${locale}/links/[shortUrl]`,
        type: 'page' as const,
      })),
    ],
    getDefaultValue: () => [],
    parse: parseLinkSourceEntries,
  },
}

export function getEditorialCollectionDescriptor<
  K extends EditorialCollectionId,
>(id: K): EditorialCollectionDescriptor<K> {
  return EDITORIAL_COLLECTIONS[id]
}

export function listEditorialCollectionDescriptors() {
  return Object.values(EDITORIAL_COLLECTIONS)
}

export class EditorialStorageError extends Error {}
export class EditorialStorageNotFoundError extends EditorialStorageError {}
export class EditorialVersionConflictError extends EditorialStorageError {}

function createVersion(serialized: string) {
  return createHash('sha256').update(serialized).digest('hex').slice(0, 12)
}

function getBlobPath(collectionId: EditorialCollectionId) {
  const descriptor = getEditorialCollectionDescriptor(collectionId)
  return `${env.editorialBlobPrefix}/${descriptor.storagePath}`
}

function getLocalPath(collectionId: EditorialCollectionId) {
  const descriptor = getEditorialCollectionDescriptor(collectionId)
  return join(LOCAL_EDITORIAL_DIR, descriptor.storagePath)
}

async function readJsonFromStream(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).json()
}

async function readBlobCollection(collectionId: EditorialCollectionId) {
  const descriptor = getEditorialCollectionDescriptor(collectionId)
  const blob = await get(getBlobPath(collectionId), {
    access: 'private',
    useCache: false,
  })

  if (!blob) {
    throw new EditorialStorageNotFoundError(
      `Editorial blob not found for ${collectionId}`,
    )
  }

  if (blob.statusCode !== 200) {
    throw new EditorialStorageError(
      `Unexpected blob status for ${collectionId}: ${blob.statusCode}`,
    )
  }

  const raw = await readJsonFromStream(blob.stream)
  const collection = descriptor.parse(raw)
  const serialized = JSON.stringify(collection, null, 2)

  return {
    collection,
    serialized,
    version: createVersion(serialized),
  }
}

async function readLocalCollection(collectionId: EditorialCollectionId) {
  const descriptor = getEditorialCollectionDescriptor(collectionId)

  try {
    const serialized = await readFile(getLocalPath(collectionId), 'utf8')
    const collection = descriptor.parse(JSON.parse(serialized))

    return {
      collection,
      serialized: serialized.trimEnd(),
      version: createVersion(serialized.trimEnd()),
    }
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new EditorialStorageNotFoundError(
        `Editorial local file not found for ${collectionId}`,
      )
    }

    throw error
  }
}

export class DefaultEditorialRepository implements EditorialRepository {
  async loadState<K extends EditorialCollectionId>(
    collectionId: K,
  ): Promise<EditorialState<K>> {
    const descriptor = getEditorialCollectionDescriptor(collectionId)

    try {
      const result = isEditorialBlobStorage
        ? await readBlobCollection(collectionId)
        : await readLocalCollection(collectionId)

      return {
        collection: result.collection as EditorialCollectionData[K],
        serialized: result.serialized,
        version: result.version,
      }
    } catch (error) {
      if (!(error instanceof EditorialStorageNotFoundError)) {
        throw error
      }

      const collection =
        descriptor.getDefaultValue() as EditorialCollectionData[K]
      const serialized = JSON.stringify(collection, null, 2)

      return {
        collection,
        serialized,
        version: createVersion(serialized),
      }
    }
  }

  async save(
    collectionId: EditorialCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const descriptor = getEditorialCollectionDescriptor(collectionId)
    const parsed = descriptor.parse(JSON.parse(rawJson))
    const serialized = JSON.stringify(parsed, null, 2)
    const nextVersion = createVersion(serialized)
    const currentState = await this.loadState(collectionId)

    if (expectedVersion && currentState.version !== expectedVersion) {
      throw new EditorialVersionConflictError(
        `Editorial collection ${collectionId} has changed since it was loaded.`,
      )
    }

    if (isEditorialBlobStorage) {
      await put(getBlobPath(collectionId), serialized, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
      })

      return {
        version: nextVersion,
      }
    }

    await mkdir(LOCAL_EDITORIAL_DIR, { recursive: true })
    await writeFile(getLocalPath(collectionId), `${serialized}\n`, 'utf8')

    return {
      version: nextVersion,
    }
  }
}

// For convenience / singleton usage
export const editorialRepository = new DefaultEditorialRepository()
