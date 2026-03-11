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

export type MDXData = {
  metadata: BlogFrontmatter
  slug: string
  rawContent: string
  fullRawContent: string
  version: string
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
