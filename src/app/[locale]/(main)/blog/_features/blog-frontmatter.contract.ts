import { parseFrontmatterBase } from './frontmatter.contract'
import type { BlogFrontmatter } from './blog.domain'

function parseTags(value: unknown, filePath: string) {
  if (value == null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error(`${filePath}: frontmatter "tags" must be an array of strings`)
  }

  const tags = value.map((tag, index) => {
    if (typeof tag !== 'string' || tag.trim().length === 0) {
      throw new Error(
        `${filePath}: frontmatter "tags[${index}]" must be a non-empty string`,
      )
    }

    return tag.trim()
  })

  return [...new Set(tags)]
}

export function parseBlogFrontmatter(
  value: unknown,
  filePath: string,
): BlogFrontmatter {
  const metadata = parseFrontmatterBase(value, filePath)

  if (
    metadata.updatedAt &&
    metadata.updatedAt.getTime() < metadata.publishedAt.getTime()
  ) {
    throw new Error(
      `${filePath}: frontmatter "updatedAt" must not be earlier than "publishedAt"`,
    )
  }

  const tags = parseTags(metadata.rest.tags, filePath)

  return {
    title: metadata.title,
    summary: metadata.summary,
    image: metadata.image,
    publishedAt: metadata.publishedAt,
    updatedAt: metadata.updatedAt,
    tags,
  }
}
