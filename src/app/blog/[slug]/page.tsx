import { notFound } from 'next/navigation'

import { baseUrl } from '@/app/sitemap'
import { ProfileCard } from '@/components/common/profile-card'
import { CustomMDX, formatDate, getBlogPosts } from '@/lib/blog'

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${post.slug}`,
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
  const awaited_posts = await getBlogPosts()
  const awaited_params = await params
  const post = awaited_posts.find((post) => post.slug === awaited_params.slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="flex flex-col items-center p-4">
      <div className="container flex flex-col items-center gap-8 px-4 pt-8">
        <section className="max-w-3xl">
          <script
            type="application/ld+json"
            suppressHydrationWarning
            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: post.metadata.title,
                datePublished: post.metadata.publishedAt,
                dateModified: post.metadata.updatedAt,
                description: post.metadata.summary,
                image: post.metadata.image
                  ? `${baseUrl}${post.metadata.image}`
                  : `/og?title=${encodeURIComponent(post.metadata.title)}`,
                url: `${baseUrl}/blog/articles/${post.slug}`,
              }),
            }}
          />
          <h1 className="title text-2xl font-semibold tracking-tighter">
            {post.metadata.title}
          </h1>
          <div className="mt-2 mb-8 flex items-center justify-between text-sm">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {formatDate(post.metadata.publishedAt)}
            </p>
          </div>
          <article className="prose prose-zinc dark:prose-invert !max-w-3xl">
            <CustomMDX source={post.rawContent} />
          </article>
        </section>
        <ProfileCard />
      </div>
    </main>
  )
}
