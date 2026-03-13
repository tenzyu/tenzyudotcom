import { readdir } from 'node:fs/promises'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path, { join } from 'node:path'
import matter from 'gray-matter'
import {
  compareBlogPostsByPublishedAtDesc,
  type BlogFrontmatter,
  type MDXData,
} from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { parseBlogFrontmatter } from '@/app/[locale]/(main)/blog/_features/blog-frontmatter.assemble'
import {
  EditorVersionConflictError,
} from './editor.domain'
import { createVersion } from './editor-version'
import type {
  EditorCollectionDescriptor,
  EditorRepository,
} from './editor.port'
import type { EditorCollectionId, EditorState } from './editor.domain'

const LOCAL_STORAGE_DIR = join(process.cwd(), 'storage')
const LOCAL_BLOG_DIR = join(LOCAL_STORAGE_DIR, 'blog')

function getLocalPath<K extends EditorCollectionId>(
  descriptor: EditorCollectionDescriptor<K>,
) {
  return join(LOCAL_STORAGE_DIR, descriptor.storagePath)
}

async function readLocalBlogPost(filePath: string): Promise<MDXData> {
  const rawContent = await readFile(filePath, 'utf8')
  const { data, content } = matter(rawContent)
  const metadata = parseBlogFrontmatter(data, filePath)

  return {
    metadata,
    slug: path.basename(filePath, path.extname(filePath)),
    rawContent: content,
    fullRawContent: rawContent,
    version: createVersion(rawContent),
  }
}

export class LocalEditorRepository implements EditorRepository {
  async loadState<K extends EditorCollectionId>(
    descriptor: EditorCollectionDescriptor<K>,
  ): Promise<EditorState<K>> {
    try {
      const serialized = await readFile(getLocalPath(descriptor), 'utf8')
      const normalized = serialized.trimEnd()

      return {
        collection: descriptor.parse(JSON.parse(normalized)),
        serialized: normalized,
        version: createVersion(normalized),
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        const collection = descriptor.getDefaultValue()
        const serialized = JSON.stringify(collection, null, 2)

        return {
          collection,
          serialized,
          version: createVersion(serialized),
        }
      }

      throw error
    }
  }

  async loadBlogCollectionState() {
    const entries = await readdir(LOCAL_BLOG_DIR).catch(() => [])
    const posts = await Promise.all(
      entries
        .filter((entry) => path.extname(entry) === '.mdx')
        .map((entry) => readLocalBlogPost(join(LOCAL_BLOG_DIR, entry))),
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
    const sanitizedFrontmatter = Object.fromEntries(
      Object.entries(frontmatter).filter(([, value]) => {
        if (value === undefined) {
          return false
        }

        if (Array.isArray(value) && value.length === 0) {
          return false
        }

        return true
      }),
    )
    const content = matter.stringify(body, sanitizedFrontmatter)
    const localPath = join(LOCAL_STORAGE_DIR, 'blog', `${slug}.mdx`)

    if (expectedVersion) {
      try {
        const existingContent = await readFile(localPath, 'utf8')
        const currentVersion = createVersion(existingContent)

        if (currentVersion !== expectedVersion) {
          throw new EditorVersionConflictError(
            `Blog post ${slug} has changed since it was loaded.`,
          )
        }
      } catch (error) {
        if (
          !(error instanceof EditorVersionConflictError) &&
          !(
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
          )
        ) {
          throw error
        }
      }
    }

    await mkdir(join(localPath, '..'), { recursive: true })
    await writeFile(localPath, content, 'utf8')
  }
}
