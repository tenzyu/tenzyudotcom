import { getLocalizedUrl, locales } from 'intlayer'
import { BASE_URL } from '@/config/site'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'

export type BlogPost = Awaited<ReturnType<typeof getBlogPosts>>[number]

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
  const ogImage = image ?? `${BASE_URL}/og?title=${encodeURIComponent(title)}`
  const localizedPath = getLocalizedUrl(`/blog/${post.slug}`, locale)
  const localizedUrl = `${BASE_URL}${localizedPath}`
  const alternateLanguages = Object.fromEntries(
    locales.map((localeItem) => [
      localeItem,
      `${BASE_URL}${getLocalizedUrl(`/blog/${post.slug}`, localeItem)}`,
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
  const ogImage = post.metadata.image
    ? `${BASE_URL}${post.metadata.image}`
    : `${BASE_URL}/og?title=${encodeURIComponent(post.metadata.title)}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.metadata.title,
    datePublished: post.metadata.publishedAt.toISOString(),
    dateModified: post.metadata.updatedAt?.toISOString(),
    description: post.metadata.summary,
    image: ogImage,
    url: `${BASE_URL}${getLocalizedUrl(`/blog/${post.slug}`, locale)}`,
    author: {
      '@type': 'Person',
      name: 'tenzyu',
    },
    publisher: {
      '@type': 'Organization',
      name: 'tenzyu.com',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/images/my-icon.png`,
      },
    },
  }
}
