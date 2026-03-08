type RawFrontmatter = Record<string, unknown>

const BASE_FRONTMATTER_KEYS = [
  'title',
  'summary',
  'image',
  'publishedAt',
  'updatedAt',
] as const

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

export function parseFrontmatterBase(
  value: unknown,
  filePath: string,
): {
  title: string
  summary: string
  image?: string
  publishedAt: Date
  updatedAt?: Date
  rest: RawFrontmatter
} {
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

  const rest = Object.fromEntries(
    Object.entries(value).filter(
      ([key]) => !(BASE_FRONTMATTER_KEYS as readonly string[]).includes(key),
    ),
  )

  return {
    title,
    summary,
    image,
    publishedAt,
    updatedAt,
    rest,
  }
}
