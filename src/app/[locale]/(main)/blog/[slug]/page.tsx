import { notFound } from 'next/navigation'
import { getLocale } from 'next-intlayer/server'
import { getLocalizedUrl, locales } from 'intlayer'

import { baseUrl } from '@/app/sitemap'
import { CustomMDX } from '@/lib/blog/custom-mdx'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'
import { formatDate } from '@/lib/blog/utils'

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await getBlogPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

type Params = Promise<{
  slug: string
}>

export async function generateMetadata({ params }: { params: Params }) {
  const locale = await getLocale()
  const awaited_posts = await getBlogPosts()
  const awaited_params = await params
  const post = awaited_posts.find((post) => post.slug === awaited_params.slug)
  if (!post) return

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata
  const ogImage = image ?? `${baseUrl}/og?title=${encodeURIComponent(title)}`
  const localizedPath = getLocalizedUrl(`/blog/${post.slug}`, locale)
  const localizedUrl = `${baseUrl}${localizedPath}`
  const alternateLanguages = Object.fromEntries(
    locales.map((localeItem) => [
      localeItem,
      `${baseUrl}${getLocalizedUrl(`/blog/${post.slug}`, localeItem)}`,
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
      publishedTime: publishedTime.toISOString(), // Ensure publishedTime is serialized
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

export default async function Blog({ params }: { params: Params }) {
  const locale = await getLocale()
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const awaited_posts = await getBlogPosts()
  const awaited_params = await params
  const post = awaited_posts.find((post) => post.slug === awaited_params.slug)

  if (!post) {
    notFound()
  }

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt.toISOString(), // Serialize date
            dateModified: post.metadata.updatedAt?.toISOString(), // Serialize date
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}${getLocalizedUrl(`/blog/${post.slug}`, locale)}`, // Corrected URL path
            author: {
              // Add author info if available
              '@type': 'Person',
              name: 'tenzyu', // Replace with actual author name if dynamic
            },
            publisher: {
              // Add publisher info
              '@type': 'Organization',
              name: 'tenzyu.com', // Replace with site name
              logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/images/my-icon.png`, // Example logo URL
              },
            },
          }),
        }}
      />
      <div className="space-y-8">
        <div>
          <h1 className="title text-2xl font-semibold tracking-tighter">
            {post.metadata.title}
          </h1>
          <div className="text-muted-foreground mt-2 text-sm">
            {formatDate(post.metadata.publishedAt, dateLocale)}
          </div>
        </div>
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <CustomMDX source={post.rawContent} />
        </article>
      </div>
    </>
  )
}
