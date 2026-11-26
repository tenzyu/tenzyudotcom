import { cache } from 'react'
import {
  SITE_AUTHOR_NAME,
  SITE_LOGO_PATH,
  SITE_PUBLISHER_NAME,
  getAbsoluteUrl,
} from '@/config/site'
import { locales } from 'intlayer'
import type { ContentSnapshot } from '@tenzyu/revisioned-content/contracts'
import { githubContentRepository } from '@/platform/content-store/github-content.infra'
import { parseBlogFrontmatter } from './blog-frontmatter.assemble'
import { resolveBlogAddress } from './blog-index.assemble'
import { loadBlogCatalog, loadBlogPostBySlug } from './blog.infra'
import {
  extractBlogHeadings,
  type BlogHeading,
  type BlogPostSummary,
  type BlogPostingJsonLd,
  type MDXData,
  compareBlogPostsByPublishedAtDesc,
  filterBlogPostsByTag,
  isAiGeneratedPost,
} from '@tenzyu/publishing-domain/blog'
import { buildBlogPostImageUrl, buildBlogPostUrl } from './blog.urls'

const PAGE_SIZE = 6

const loadCatalog = cache(loadBlogCatalog)

export async function canonicalizeBlogRedirect(location: string) {
  const target = new URL(location)
  const match = /^(\/en)?\/blog\/([^/]+)$/.exec(target.pathname)
  if (!match) return

  try {
    const slug = decodeURIComponent(match[2])
    const catalog = await loadBlogCatalog(
      await githubContentRepository.snapshot(),
    )
    const address = resolveBlogAddress(catalog, slug)
    if (address.kind === 'alias') {
      target.pathname = `${match[1] ?? ''}/blog/${encodeURIComponent(address.entry.slug)}`
      return target.href
    }
  } catch {
    // Let the localized route handle a content read failure.
  }
}

export const loadBlogPosts = cache(async (snapshot: ContentSnapshot) => {
  const { canonicals } = await loadCatalog(snapshot)
  const posts: BlogPostSummary[] = []
  for (const entry of canonicals.values()) {
    if (entry) {
      posts.push({
        slug: entry.slug,
        metadata: parseBlogFrontmatter(entry.metadata, entry.pathname),
      })
    }
  }
  return posts.sort(compareBlogPostsByPublishedAtDesc)
})

export type BlogListItem = BlogPostSummary

export type PaginatedBlogPosts = {
  currentPage: number
  pageItems: BlogListItem[]
  totalPages: number
}

export async function assemblePaginatedBlogPosts(
  snapshot: ContentSnapshot,
  rawPage?: string,
  tag?: string,
): Promise<PaginatedBlogPosts> {
  const posts = filterBlogPostsByTag(await loadBlogPosts(snapshot), tag)
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  const pageParam = Number(rawPage ?? 1)
  const currentPage = Number.isFinite(pageParam)
    ? Math.min(Math.max(Math.floor(pageParam), 1), Math.max(totalPages, 1))
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

type BlogPostPageData =
  | { kind: 'redirect'; slug: string }
  | {
      kind: 'post'
      post: BlogPost
      headings: BlogHeading[]
      relatedPosts: BlogPostSummary[]
      isAiGenerated: boolean
    }

export const assembleBlogPostPageData = cache(
  async (
    snapshot: ContentSnapshot,
    slug: string,
  ): Promise<BlogPostPageData | undefined> => {
    const address = resolveBlogAddress(await loadCatalog(snapshot), slug)
    if (address.kind === 'alias') {
      return { kind: 'redirect', slug: address.entry.slug }
    }
    const pathname =
      address.kind === 'canonical' ? address.entry.pathname : undefined
    const post = await loadBlogPostBySlug(snapshot, slug, pathname)

    if (!post) {
      return undefined
    }

    const posts = await loadBlogPosts(snapshot)
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

      if (
        relatedPosts.some((relatedEntry) => relatedEntry.slug === entry.slug)
      ) {
        continue
      }

      relatedPosts.push(entry)
    }

    return {
      kind: 'post',
      post,
      headings: extractBlogHeadings(post.rawContent),
      relatedPosts,
      isAiGenerated: isAiGeneratedPost(post.metadata.tags),
    }
  },
)

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
