import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseNoteSourceEntries } from '@/app/[locale]/(main)/notes/_features/notes.contract'
import { parseDashboardSourceCategories } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.contract'
import { parsePuzzleSourceCategories } from '@/app/[locale]/(main)/puzzles/_features/puzzles.contract'
import { parseRecommendationSourceEntries } from '@/app/[locale]/(main)/recommendations/_features/recommendations.contract'
import { env, isEditorBlobStorage } from '@/config/env.contract'
import { parseLinkSourceEntries } from '@/features/links/links.contract'
import { get, list, put } from '@vercel/blob'
import matter from 'gray-matter'
import { loadBlogPosts } from '@/app/[locale]/(main)/blog/_features/blog.assemble'
import type { BlogFrontmatter, MDXData } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { createVersion } from '@/app/[locale]/(admin)/editor/_features/editor-utils'
import type {
  EditorCollectionData,
  EditorCollectionId,
  EditorRepository,
  EditorState,
  RevalidatePathTarget,
} from './editor.port'

const LOCAL_EDITOR_DIR = join(process.cwd(), 'storage', 'editor')

export type EditorCollectionDescriptor<K extends EditorCollectionId> = {
  id: K
  label: string
  storagePath: string
  publicPaths: readonly RevalidatePathTarget[]
  getDefaultValue: () => EditorCollectionData[K]
  parse: (raw: unknown) => EditorCollectionData[K]
}

const LOCALE_PREFIXES = ['/ja', '/en'] as const

function withLocales(pathname: string) {
  return LOCALE_PREFIXES.map((locale) => ({
    path: `${locale}${pathname}`,
  })) satisfies readonly RevalidatePathTarget[]
}

export const EDITOR_COLLECTIONS: {
  [K in EditorCollectionId]: EditorCollectionDescriptor<K>
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
  blog: {
    id: 'blog',
    label: 'Blog',
    storagePath: 'blog',
    publicPaths: withLocales('/blog'),
    getDefaultValue: () => [],
    parse: (raw: unknown) => raw as MDXData[], // Not used for full array saving
  },
}

export function getEditorCollectionDescriptor<
  K extends EditorCollectionId,
>(id: K): EditorCollectionDescriptor<K> {
  return EDITOR_COLLECTIONS[id]
}

export function listEditorCollectionDescriptors() {
  return Object.values(EDITOR_COLLECTIONS)
}

export class EditorStorageError extends Error {}
export class EditorStorageNotFoundError extends EditorStorageError {}
export class EditorVersionConflictError extends EditorStorageError {}

function getBlobPath(collectionId: EditorCollectionId) {
  const descriptor = getEditorCollectionDescriptor(collectionId)
  return `${env.editorBlobPrefix}/${descriptor.storagePath}`
}

function getLocalPath(collectionId: EditorCollectionId) {
  const descriptor = getEditorCollectionDescriptor(collectionId)
  return join(LOCAL_EDITOR_DIR, descriptor.storagePath)
}

async function readJsonFromStream(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).json()
}

async function readBlobCollection(collectionId: EditorCollectionId) {
  const descriptor = getEditorCollectionDescriptor(collectionId)
  const path = getBlobPath(collectionId)

  // Find the blob by prefix to get the full URL
  const { blobs } = await list({
    prefix: path,
    limit: 1,
  })

  const targetBlob = blobs.find((b) => b.pathname === path)

  if (!targetBlob) {
    throw new EditorStorageNotFoundError(
      `Editor blob not found for ${collectionId} at path ${path}`,
    )
  }

  const blob = await get(targetBlob.url, {
    access: 'public',
    useCache: false,
  })

  if (!blob) {
    throw new EditorStorageNotFoundError(
      `Editor blob not found for ${collectionId}`,
    )
  }

  if (blob.statusCode !== 200) {
    throw new EditorStorageError(
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

async function readLocalCollection(collectionId: EditorCollectionId) {
  const descriptor = getEditorCollectionDescriptor(collectionId)

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
      throw new EditorStorageNotFoundError(
        `Editor local file not found for ${collectionId}`,
      )
    }

    throw error
  }
}

export class DefaultEditorRepository implements EditorRepository {
  async loadState<K extends EditorCollectionId>(
    collectionId: K,
  ): Promise<EditorState<K>> {
    const descriptor = getEditorCollectionDescriptor(collectionId)

    if (collectionId === 'blog') {
      const posts = await loadBlogPosts()
      // For blog, the 'version' of the whole collection is less useful than individual post versions,
      // but we provide a hash of the combined content for the collection state.
      const combinedContent = posts.map(p => p.fullRawContent).join('')
      const version = createVersion(combinedContent)
      return {
        collection: posts as unknown as EditorCollectionData[K],
        serialized: '', // We don't use raw JSON for blog collection editing
        version,
      }
    }

    try {
      const result = isEditorBlobStorage
        ? await readBlobCollection(collectionId)
        : await readLocalCollection(collectionId)

      return {
        collection: result.collection as EditorCollectionData[K],
        serialized: result.serialized,
        version: result.version,
      }
    } catch (error) {
      if (!(error instanceof EditorStorageNotFoundError)) {
        throw error
      }

      const collection =
        descriptor.getDefaultValue() as EditorCollectionData[K]
      const serialized = JSON.stringify(collection, null, 2)

      return {
        collection,
        serialized,
        version: createVersion(serialized),
      }
    }
  }

  async save(
    collectionId: EditorCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const descriptor = getEditorCollectionDescriptor(collectionId)
    const parsed = descriptor.parse(JSON.parse(rawJson))
    const serialized = JSON.stringify(parsed, null, 2)
    const nextVersion = createVersion(serialized)
    const currentState = await this.loadState(collectionId)

    if (expectedVersion && currentState.version !== expectedVersion) {
      throw new EditorVersionConflictError(
        `Editor collection ${collectionId} has changed since it was loaded.`,
      )
    }

    if (isEditorBlobStorage) {
      await put(getBlobPath(collectionId), serialized, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
      })

      return {
        version: nextVersion,
      }
    }

    await mkdir(LOCAL_EDITOR_DIR, { recursive: true })
    await writeFile(getLocalPath(collectionId), `${serialized}\n`, 'utf8')

    return {
      version: nextVersion,
    }
  }

  async saveBlogPost(
    slug: string,
    frontmatter: BlogFrontmatter,
    body: string,
    expectedVersion?: string,
  ): Promise<void> {
    const content = matter.stringify(body, frontmatter)
    const filename = `${slug}.mdx`

    if (expectedVersion) {
      const posts = await loadBlogPosts()
      const existingPost = posts.find((p) => p.slug === slug)
      if (existingPost) {
        const currentVersion = createVersion(existingPost.fullRawContent)
        if (currentVersion !== expectedVersion) {
          throw new EditorVersionConflictError(
            `Blog post ${slug} has changed since it was loaded.`,
          )
        }
      }
    }

    if (isEditorBlobStorage) {
      await put(`blog/${filename}`, content, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'text/markdown',
      })
      return
    }

    const localPath = join(process.cwd(), 'storage', 'blog', filename)
    await mkdir(join(localPath, '..'), { recursive: true })
    await writeFile(localPath, content, 'utf8')
  }
}
  

export function matchCollectionIdByPath(
  pathname: string,
): EditorCollectionId | null {
  const normalizedPath = pathname.replace(/^\/(ja|en)\//, '/')
  if (normalizedPath.startsWith('/blog')) return 'blog'
  if (normalizedPath.startsWith('/recommendations')) return 'recommendations'
  if (normalizedPath.startsWith('/notes')) return 'notes'
  if (normalizedPath.startsWith('/puzzles')) return 'puzzles'
  if (normalizedPath.startsWith('/pointers')) return 'pointers'
  if (normalizedPath.startsWith('/links')) return 'links'
  return null
}

// For convenience / singleton usage
export const editorRepository = new DefaultEditorRepository()
