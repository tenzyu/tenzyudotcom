import { get, list, put } from '@vercel/blob'
import matter from 'gray-matter'
import path from 'node:path'
import {
  compareBlogPostsByPublishedAtDesc,
  type BlogFrontmatter,
  type MDXData,
} from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { parseBlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog-frontmatter.assemble'
import { env } from '@/config/env.infra'
import {
  EditorStorageError,
  EditorStorageNotFoundError,
  EditorVersionConflictError,
} from './editor.domain'
import { createVersion } from './editor-version'
import type {
  EditorCollectionDescriptor,
  EditorCollectionId,
  EditorRepository,
  EditorState,
} from './editor.port'

function getBlobPath<K extends EditorCollectionId>(
  descriptor: EditorCollectionDescriptor<K>,
) {
  return descriptor.storagePath
}

async function readJsonFromStream(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).json()
}

async function readBlogPostFromBlob(blobUrl: string, slug: string): Promise<MDXData> {
  const response = await get(blobUrl, {
    access: 'public',
    token: env.blobReadWriteToken,
  })

  if (!response) {
    throw new EditorStorageNotFoundError(
      `Blog blob not found for ${slug}`,
    )
  }

  const rawContent = await new Response(response.stream).text()
  const { data, content } = matter(rawContent)
  const metadata = parseBlogFrontmatter(data, slug)

  return {
    metadata,
    slug,
    rawContent: content,
    fullRawContent: rawContent,
    version: createVersion(rawContent),
  }
}

export class BlobEditorRepository implements EditorRepository {
  async loadState<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
  ): Promise<EditorState<K>> {
    try {
      const path = getBlobPath(descriptor)
      const { blobs } = await list({
        prefix: path,
        limit: 1,
        token: env.blobReadWriteToken,
      })

      const targetBlob = blobs.find((blob) => blob.pathname === path)

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
    } catch (error) {
      if (!(error instanceof EditorStorageNotFoundError)) {
        throw error
      }

      const collection = descriptor.getDefaultValue()
      const serialized = JSON.stringify(collection, null, 2)

      return {
        collection,
        serialized,
        version: createVersion(serialized),
      }
    }
  }

  async loadBlogCollectionState() {
    const { blobs } = await list({
      prefix: 'blog/',
      token: env.blobReadWriteToken,
    })

    const posts = await Promise.all(
      blobs
        .filter((blob) => blob.pathname.endsWith('.mdx'))
        .map((blob) =>
          readBlogPostFromBlob(blob.url, path.basename(blob.pathname, '.mdx')),
        ),
    )
    const collection = posts.sort(compareBlogPostsByPublishedAtDesc)
    const combinedContent = collection.map((post) => post.fullRawContent).join('')

    return {
      collection,
      serialized: '',
      version: createVersion(combinedContent),
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

  async saveBlogPost(
    slug: string,
    frontmatter: BlogFrontmatter,
    body: string,
    expectedVersion?: string,
  ): Promise<void> {
    const storagePath = `blog/${slug}.mdx`
    const content = matter.stringify(body, frontmatter)

    if (expectedVersion) {
      const { blobs } = await list({
        prefix: storagePath,
        limit: 1,
        token: env.blobReadWriteToken,
      })
      const targetBlob = blobs.find((blob) => blob.pathname === storagePath)

      if (targetBlob) {
        const response = await get(targetBlob.url, {
          access: 'public',
          token: env.blobReadWriteToken,
        })

        if (response) {
          const currentVersion = createVersion(
            await new Response(response.stream).text(),
          )

          if (currentVersion !== expectedVersion) {
            throw new EditorVersionConflictError(
              `Blog post ${slug} has changed since it was loaded.`,
            )
          }
        }
      }
    }

    await put(storagePath, content, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'text/markdown',
      token: env.blobReadWriteToken,
    })
  }
}
