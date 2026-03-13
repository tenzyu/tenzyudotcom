import { cache } from 'react'
import {
  SITE_AUTHOR_NAME,
  SITE_LOGO_PATH,
  SITE_PUBLISHER_NAME,
  getAbsoluteUrl,
} from '@/config/site'
import { locales } from 'intlayer'
import { makeEditorRepository } from '@/lib/editor/editor.assemble'
import {
  extractBlogHeadings,
  type BlogPostingJsonLd,
  type MDXData,
  buildBlogPostImageUrl,
  buildBlogPostUrl,
  compareBlogPostsByPublishedAtDesc,
  isAiGeneratedPost,
} from './blog.domain'

const PAGE_SIZE = 6

export const loadBlogPosts = cache(async () => {
  const { collection } = await makeEditorRepository().loadBlogCollectionState()
  return [...collection].sort(compareBlogPostsByPublishedAtDesc)
})

export type BlogListItem = MDXData

export type PaginatedBlogPosts = {
  currentPage: number
  pageItems: BlogListItem[]
  totalPages: number
}

export async function assemblePaginatedBlogPosts(
  rawPage?: string,
): Promise<PaginatedBlogPosts> {
  const posts = await loadBlogPosts()
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  const pageParam = Number(rawPage ?? 1)
  const currentPage = Number.isFinite(pageParam)
    ? Math.min(Math.max(pageParam, 1), Math.max(totalPages, 1))
    : 1
  const startIndex = (currentPage - 1) * PAGE_SIZE

  return {
    currentPage,
    pageItems:
      totalPages > 0 ? posts.slice(startIndex, startIndex + PAGE_SIZE) : [],
    totalPages,
  }
}

export type BlogPost = MDXData

export async function getBlogStaticParams() {
  const posts = await loadBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await loadBlogPosts()

  return posts.find((post) => post.slug === slug)
}

export async function assembleBlogPostPageData(slug: string) {
  const posts = await loadBlogPosts()
  const post = posts.find((entry) => entry.slug === slug)

  if (!post) {
    return undefined
  }

  const postTags = post.metadata.tags ?? []
  const rankedByTags = posts
    .filter((entry) => entry.slug !== slug)
    .map((entry) => {
      const overlapCount = (entry.metadata.tags ?? []).filter((tag) =>
        postTags.includes(tag),
      ).length

      return {
        entry,
        overlapCount,
      }
    })
    .filter(({ overlapCount }) => overlapCount > 0)
    .sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) {
        return b.overlapCount - a.overlapCount
      }

      return compareBlogPostsByPublishedAtDesc(a.entry, b.entry)
    })
    .map(({ entry }) => entry)
  const fallbackRecentPosts = posts.filter((entry) => entry.slug !== slug)
  const relatedPosts = [...rankedByTags]

  for (const entry of fallbackRecentPosts) {
    if (relatedPosts.length >= 3) {
      break
    }

    if (relatedPosts.some((relatedEntry) => relatedEntry.slug === entry.slug)) {
      continue
    }

    relatedPosts.push(entry)
  }

  return {
    post,
    headings: extractBlogHeadings(post.rawContent),
    relatedPosts,
    isAiGenerated: isAiGeneratedPost(post.metadata.tags),
  }
}

export function buildBlogPostMetadata(post: BlogPost, locale: string) {
  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata
  const ogImage = buildBlogPostImageUrl(title, image)
  const localizedUrl = buildBlogPostUrl(post.slug, locale)
  const alternateLanguages = Object.fromEntries(
    locales.map((localeItem) => [
      localeItem,
      buildBlogPostUrl(post.slug, localeItem),
    ]),
  )

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: publishedTime.toISOString(),
      url: localizedUrl,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export function buildBlogPostStructuredData(post: BlogPost, locale: string) {
  const url = buildBlogPostUrl(post.slug, locale)
  const ogImage = buildBlogPostImageUrl(
    post.metadata.title,
    post.metadata.image,
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.metadata.title,
    datePublished: post.metadata.publishedAt.toISOString(),
    dateModified: post.metadata.updatedAt?.toISOString(),
    description: post.metadata.summary,
    image: ogImage,
    url,
    mainEntityOfPage: url,
    keywords: post.metadata.tags,
    author: {
      '@type': 'Person',
      name: SITE_AUTHOR_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_PUBLISHER_NAME,
      logo: {
        '@type': 'ImageObject',
        url: getAbsoluteUrl(SITE_LOGO_PATH),
      },
    },
  } satisfies BlogPostingJsonLd
}
