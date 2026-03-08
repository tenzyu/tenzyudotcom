import { getLocalizedUrl, locales } from 'intlayer'
import {
  BASE_URL,
  buildOgTitleImageUrl,
  getAbsoluteUrl,
  SITE_AUTHOR_NAME,
  SITE_LOGO_PATH,
  SITE_PUBLISHER_NAME,
} from '@/config/site'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'

export type BlogPost = Awaited<ReturnType<typeof getBlogPosts>>[number]

type BlogPostingJsonLd = {
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

const buildBlogPostUrl = (slug: string, locale: string) =>
  `${BASE_URL}${getLocalizedUrl(`/blog/${slug}`, locale)}`

const buildBlogPostImageUrl = (title: string, image?: string) =>
  image ? getAbsoluteUrl(image) : buildOgTitleImageUrl(title)

export async function getBlogStaticParams() {
  const posts = await getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function getBlogPostBySlug(slug: string) {
  const posts = await getBlogPosts()

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
