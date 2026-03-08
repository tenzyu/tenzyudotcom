import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { get, put } from '@vercel/blob'
import { env, isEditorialBlobStorage } from '@/config/env.contract'
import {
  type EditorialCollectionData,
  type EditorialCollectionId,
  getEditorialCollectionDescriptor,
} from './registry'

const LOCAL_EDITORIAL_DIR = join(process.cwd(), 'storage', 'editorial')

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

export async function loadEditorialCollectionState<
  K extends EditorialCollectionId,
>(
  collectionId: K,
): Promise<{
  collection: EditorialCollectionData[K]
  serialized: string
  version: string
}> {
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

export async function loadEditorialCollection<K extends EditorialCollectionId>(
  collectionId: K,
): Promise<EditorialCollectionData[K]> {
  const state = await loadEditorialCollectionState(collectionId)
  return state.collection
}

export async function getEditorialCollectionJson(
  collectionId: EditorialCollectionId,
) {
  const state = await loadEditorialCollectionState(collectionId)
  return state.serialized
}

export async function saveEditorialCollection<K extends EditorialCollectionId>(
  collectionId: K,
  rawJson: string,
  expectedVersion?: string,
) {
  const descriptor = getEditorialCollectionDescriptor(collectionId)
  const parsed = descriptor.parse(JSON.parse(rawJson))
  const serialized = JSON.stringify(parsed, null, 2)
  const nextVersion = createVersion(serialized)
  const currentState = await loadEditorialCollectionState(collectionId)

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
      collection: parsed,
      version: nextVersion,
    }
  }

  await mkdir(LOCAL_EDITORIAL_DIR, { recursive: true })
  await writeFile(getLocalPath(collectionId), `${serialized}\n`, 'utf8')

  return {
    collection: parsed,
    version: nextVersion,
  }
}
