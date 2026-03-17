import { getLocalizedUrl } from 'intlayer'
import {
  BASE_URL,
  buildOgTitleImageUrl,
  getAbsoluteUrl,
} from '@/config/site'

export type FrontmatterBase = {
  title: string
  summary: string
  image?: string
  publishedAt: Date
  updatedAt?: Date
}

export type Frontmatter<
  T extends Record<string, unknown> = Record<string, never>,
> = FrontmatterBase & T

export type BlogFrontmatter = Frontmatter<{
  tags?: string[]
}>

export type BlogHeading = {
  id: string
  level: 2 | 3
  title: string
}

export type MDXData = {
  metadata: BlogFrontmatter
  slug: string
  rawContent: string
  fullRawContent: string
  version: string
}

export type BlogPostSummary = {
  metadata: BlogFrontmatter
  slug: string
}

export function compareBlogPostsByPublishedAtDesc(a: MDXData, b: MDXData) {
  return (
    new Date(b.metadata.publishedAt).getTime() -
    new Date(a.metadata.publishedAt).getTime()
  )
}

export type BlogPostingJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'BlogPosting'
  headline: string
  datePublished: string
  dateModified?: string
  description: string
  image: string
  url: string
  mainEntityOfPage: string
  keywords?: string[]
  author: {
    '@type': 'Person'
    name: string
  }
  publisher: {
    '@type': 'Organization'
    name: string
    logo: {
      '@type': 'ImageObject'
      url: string
    }
  }
}

export const buildBlogPostUrl = (slug: string, locale: string) =>
  `${BASE_URL}${getLocalizedUrl(`/blog/${slug}`, locale)}`

export const buildBlogPostImageUrl = (title: string, image?: string) =>
  image ? getAbsoluteUrl(image) : buildOgTitleImageUrl(title)

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\([^)]+\)/g
const MARKDOWN_INLINE_CODE_PATTERN = /`([^`]+)`/g
const MARKDOWN_EMPHASIS_PATTERN = /(\*\*|__|\*|_|~~)/g
const HTML_TAG_PATTERN = /<[^>]+>/g

const normalizeHeadingText = (value: string) =>
  value
    .replace(MARKDOWN_IMAGE_PATTERN, '$1')
    .replace(MARKDOWN_LINK_PATTERN, '$1')
    .replace(MARKDOWN_INLINE_CODE_PATTERN, '$1')
    .replace(MARKDOWN_EMPHASIS_PATTERN, '')
    .replace(HTML_TAG_PATTERN, '')
    .trim()

export function slugifyBlogHeading(value: string) {
  return normalizeHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function extractBlogHeadings(source: string): BlogHeading[] {
  const slugCount = new Map<string, number>()

  return source
    .split('\n')
    .map((line) => /^(##|###)\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => {
      const level = match[1].length as 2 | 3
      const title = normalizeHeadingText(match[2])
      const baseSlug = slugifyBlogHeading(title) || 'section'
      const count = slugCount.get(baseSlug) ?? 0
      slugCount.set(baseSlug, count + 1)

      return {
        level,
        title,
        id: count === 0 ? baseSlug : `${baseSlug}-${count}`,
      } satisfies BlogHeading
    })
}

export function isAiGeneratedPost(tags?: readonly string[]) {
  if (!tags || tags.length === 0) {
    return false
  }

  return tags.some((tag) => {
    const normalized = tag.trim().toLowerCase()
    return normalized === 'ai generated' || normalized === 'ai-generated'
  })
}

export function stripLeadingBlogTitle(source: string, title: string) {
  const lines = source.split('\n')
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim().length > 0)

  if (firstNonEmptyIndex === -1) {
    return source
  }

  const firstLine = lines[firstNonEmptyIndex]
  const match = /^#\s+(.+)$/.exec(firstLine.trim())

  if (!match) {
    return source
  }

  const normalizedHeading = normalizeHeadingText(match[1])
  const normalizedTitle = normalizeHeadingText(title)

  if (normalizedHeading !== normalizedTitle) {
    return source
  }

  const nextLines = [...lines]
  nextLines.splice(firstNonEmptyIndex, 1)

  if (nextLines[firstNonEmptyIndex]?.trim() === '') {
    nextLines.splice(firstNonEmptyIndex, 1)
  }

  return nextLines.join('\n')
}
