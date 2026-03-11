import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { isEditorBlobStorage, env } from '@/config/env.contract'
import { get, list, put } from '@vercel/blob'
import matter from 'gray-matter'
import { loadBlogPosts } from '@/app/[locale]/(main)/blog/_features/blog.assemble'
import type { BlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { createVersion } from '@/app/[locale]/(admin)/editor/_features/editor-utils'
import type {
  EditorCollectionId,
  EditorRepository,
  EditorState,
  EditorCollectionDescriptor,
} from './editor.port'
import {
  EditorStorageError,
  EditorStorageNotFoundError,
  EditorVersionConflictError,
  type EditorCollectionData,
} from './editor.domain'

const LOCAL_STORAGE_DIR = join(process.cwd(), 'storage')

function getBlobPath<K extends EditorCollectionId>(descriptor: EditorCollectionDescriptor<K>) {
  return descriptor.storagePath
}

function getLocalPath<K extends EditorCollectionId>(descriptor: EditorCollectionDescriptor<K>) {
  return join(LOCAL_STORAGE_DIR, descriptor.storagePath)
}

async function readJsonFromStream(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).json()
}

async function readBlobCollection<K extends EditorCollectionId>(
  descriptor: EditorCollectionDescriptor<K>,
) {
  const path = getBlobPath(descriptor)

  // Find the blob by prefix to get the full URL
  const { blobs } = await list({
    prefix: path,
    limit: 1,
    token: env.blobReadWriteToken,
  })

  const targetBlob = blobs.find((b) => b.pathname === path)

  if (!targetBlob) {
    throw new EditorStorageNotFoundError(
      `Editor blob not found for ${descriptor.id} at path ${path}`,
    )
  }

  const blob = await get(targetBlob.url, {
    access: 'public',
    token: env.blobReadWriteToken,
  })

  if (!blob) {
    throw new EditorStorageNotFoundError(
      `Editor blob not found for ${descriptor.id}`,
    )
  }

  if (blob.statusCode !== 200) {
    throw new EditorStorageError(
      `Unexpected blob status for ${descriptor.id}: ${blob.statusCode}`,
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

async function readLocalCollection<K extends EditorCollectionId>(
  descriptor: EditorCollectionDescriptor<K>,
) {
  try {
    const serialized = await readFile(getLocalPath(descriptor), 'utf8')
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
        `Editor local file not found for ${descriptor.id}`,
      )
    }

    throw error
  }
}

export class DefaultEditorRepository implements EditorRepository {
  async loadState<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
  ): Promise<EditorState<K>> {
    if (descriptor.id === 'blog') {
      const posts = await loadBlogPosts()
      // For blog, the 'version' of the whole collection is less useful than individual post versions,
      // but we provide a hash of the combined content for the collection state.
      const combinedContent = posts.map((p) => p.fullRawContent).join('')
      const version = createVersion(combinedContent)
      return {
        collection: posts as unknown as EditorCollectionData[K],
        serialized: '', // We don't use raw JSON for blog collection editing
        version,
      }
    }

    try {
      const result = isEditorBlobStorage
        ? await readBlobCollection(descriptor)
        : await readLocalCollection(descriptor)

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

  async save<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const parsed = descriptor.parse(JSON.parse(rawJson))
    const serialized = JSON.stringify(parsed, null, 2)
    const nextVersion = createVersion(serialized)
    const currentState = await this.loadState(descriptor)

    if (expectedVersion && currentState.version !== expectedVersion) {
      throw new EditorVersionConflictError(
        `Editor collection ${descriptor.id} has changed since it was loaded.`,
      )
    }

    if (isEditorBlobStorage) {
      await put(getBlobPath(descriptor), serialized, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
        token: env.blobReadWriteToken,
      })

      return {
        version: nextVersion,
      }
    }

    const localPath = getLocalPath(descriptor)
    await mkdir(join(localPath, '..'), { recursive: true })
    await writeFile(localPath, `${serialized}\n`, 'utf8')

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
    // For blog, we need the descriptor to get the storage path
    // We import it locally to avoid coupling Layer 5 to specific Layer 1 features if possible,
    // but since blog is special-cased in this repository, we can either pass it or import it.
    // Actually, DefaultEditorRepository should probably be initialized with its own config.
    // But for now, we'll keep it simple.
    const content = matter.stringify(body, frontmatter)
    const filename = `${slug}.mdx`
    const storagePath = `blog/${filename}`

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
      await put(storagePath, content, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'text/markdown',
        token: env.blobReadWriteToken,
      })
      return
    }

    const localPath = join(LOCAL_STORAGE_DIR, storagePath)
    await mkdir(join(localPath, '..'), { recursive: true })
    await writeFile(localPath, content, 'utf8')
  }
}

export function matchCollectionIdByPath(
  pathname: string,
): EditorCollectionId | null {
  const normalizedPath = pathname.replace(/^\/(ja|en)(\/|$)/, '/')
  if (normalizedPath === '/blog' || normalizedPath.startsWith('/blog/'))
    return 'blog'
  if (
    normalizedPath === '/recommendations' ||
    normalizedPath.startsWith('/recommendations/')
  )
    return 'recommendations'
  if (normalizedPath === '/notes' || normalizedPath.startsWith('/notes/'))
    return 'notes'
  if (normalizedPath === '/puzzles' || normalizedPath.startsWith('/puzzles/'))
    return 'puzzles'
  if (normalizedPath === '/pointers' || normalizedPath.startsWith('/pointers/'))
    return 'pointers'
  if (normalizedPath === '/links' || normalizedPath.startsWith('/links/'))
    return 'links'
  return null
}

// For convenience / singleton usage
export const editorRepository = new DefaultEditorRepository()
