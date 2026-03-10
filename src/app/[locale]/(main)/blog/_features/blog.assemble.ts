import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { cache } from 'react'
import { parseBlogFrontmatter } from './blog-frontmatter.contract'
import {
  SITE_AUTHOR_NAME,
  SITE_LOGO_PATH,
  SITE_PUBLISHER_NAME,
  getAbsoluteUrl,
} from '@/config/site'
import { locales } from 'intlayer'
import {
  type BlogPostingJsonLd,
  type MDXData,
  buildBlogPostImageUrl,
  buildBlogPostUrl,
  compareBlogPostsByPublishedAtDesc,
} from './blog.domain'
import { isEditorBlobStorage } from '@/config/env.contract'
import { list, get } from '@vercel/blob'

import { createVersion } from '@/app/[locale]/(admin)/editor/_features/editor-utils'

const PAGE_SIZE = 6

async function getMDXFiles(dir: string): Promise<string[]> {
  try {
    return (await fs.promises.readdir(dir)).filter(
      (file) => path.extname(file) === '.mdx',
    )
  } catch {
    return []
  }
}

async function readMDXFile(filePath: string): Promise<MDXData> {
  const rawContent = await fs.promises.readFile(filePath, 'utf-8')
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

async function getMDXData(dir: string): Promise<MDXData[]> {
  const files = await getMDXFiles(dir)
  return Promise.all(files.map((file) => readMDXFile(path.join(dir, file))))
}

async function readMDXFromBlob(blobUrl: string, slug: string): Promise<MDXData> {
  const response = await get(blobUrl, {
    access: 'public',
    useCache: false,
  })
  if (!response) {
    throw new Error(`Failed to fetch blog post from blob: ${blobUrl}`)
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

async function getMDXDataFromBlob(): Promise<MDXData[]> {
  const { blobs } = await list({
    prefix: 'blog/',
  })

  const mdxBlobs = blobs.filter((b) => b.pathname.endsWith('.mdx'))

  return Promise.all(
    mdxBlobs.map((blob) => {
      const slug = path.basename(blob.pathname, '.mdx')
      return readMDXFromBlob(blob.url, slug)
    }),
  )
}

export const loadBlogPosts = cache(async () => {
  if (isEditorBlobStorage) {
    return (await getMDXDataFromBlob()).sort(compareBlogPostsByPublishedAtDesc)
  }

  const posts = await getMDXData(path.join(process.cwd(), 'storage', 'blog'))
  return [...posts].sort(compareBlogPostsByPublishedAtDesc)
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
