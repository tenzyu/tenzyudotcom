import type { BlogFrontmatter } from '@tenzyu/publishing-domain/blog'

type RawFrontmatter = Record<string, unknown>

const isRecord = (value: unknown): value is RawFrontmatter =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readRequiredString = (value: unknown, name: string, filePath: string) => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `${filePath}: frontmatter "${name}" must be a non-empty string`,
    )
  }

  return value
}

const readOptionalString = (value: unknown, name: string, filePath: string) => {
  if (value == null) {
    return undefined
  }

  return readRequiredString(value, name, filePath)
}

const parseDateLike = (value: unknown) =>
  value instanceof Date
    ? value
    : typeof value === 'string'
      ? new Date(value)
      : null

const readRequiredDate = (value: unknown, name: string, filePath: string) => {
  const parsed = parseDateLike(value)

  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    throw new Error(`${filePath}: frontmatter "${name}" must be a valid date`)
  }

  return parsed
}

const readOptionalDate = (value: unknown, name: string, filePath: string) => {
  if (value == null) {
    return undefined
  }

  return readRequiredDate(value, name, filePath)
}

function parseTags(value: unknown, filePath: string) {
  if (value == null) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw new Error(
      `${filePath}: frontmatter "tags" must be an array of strings`,
    )
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
  if (!isRecord(value)) {
    throw new Error(`${filePath}: frontmatter must be an object`)
  }

  const title = readRequiredString(value.title, 'title', filePath)
  const summary = readRequiredString(value.summary, 'summary', filePath)
  const image = readOptionalString(value.image, 'image', filePath)
  const publishedAt = readRequiredDate(
    value.publishedAt,
    'publishedAt',
    filePath,
  )
  const updatedAt = readOptionalDate(value.updatedAt, 'updatedAt', filePath)

  const rawTags = Object.entries(value).find(([key]) => key === 'tags')?.[1]

  if (
    updatedAt &&
    updatedAt.getTime() < publishedAt.getTime()
  ) {
    throw new Error(
      `${filePath}: frontmatter "updatedAt" must not be earlier than "publishedAt"`,
    )
  }

  const tags = parseTags(rawTags, filePath)

  return {
    title,
    summary,
    image,
    publishedAt,
    updatedAt,
    tags,
  }
}
