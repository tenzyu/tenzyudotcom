import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getLocale } from 'next-intlayer/server'
import { BlogPostPageContent } from '@/features/blog/detail/blog-post-page-content'
import {
  assembleBlogPostPageData,
  buildBlogPostMetadata,
} from '@/features/blog/blog.assemble'
import { loadPublication } from '@/platform/content-store/publication.assemble'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import { prepareContentMDX } from '@/components/site/content-mdx'
import { blogMdxComponents } from '@/features/blog/mdx-components'
import { stripLeadingBlogTitle } from '@tenzyu/publishing-domain/blog'

type Params = Promise<{
  slug: string
}>

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export async function generateMetadata({ params }: { params: Params }) {
  await connection()
  const locale = await getLocale()
  const { slug } = await params
  const pageData = await assembleBlogPostPageData(await loadPublication(), slug)
  if (pageData?.kind !== 'post') return

  return buildBlogPostMetadata(pageData.post, locale)
}

export default async function Blog({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  await connection()
  const locale = await getLocale()
  const { slug } = await params
  const pageData = await assembleBlogPostPageData(await loadPublication(), slug)

  if (!pageData) {
    notFound()
  }
  if (pageData.kind === 'redirect') {
    const query = new URLSearchParams()
    for (const [key, values] of Object.entries(await searchParams)) {
      for (const value of [values ?? []].flat()) query.append(key, value)
    }
    const pathname = buildLocalizedUrl(
      `/blog/${encodeURIComponent(pageData.slug)}`,
      locale,
    )
    redirect(query.size ? `${pathname}?${query}` : pathname)
  }

  const { content, headings } = await prepareContentMDX({
    source: stripLeadingBlogTitle(pageData.post.rawContent, pageData.post.metadata.title),
    scope: 'blog',
    additionalComponents: blogMdxComponents,
  })

  return (
    <BlogPostPageContent
      locale={locale}
      post={pageData.post}
      headings={headings}
      body={content}
      relatedPosts={pageData.relatedPosts}
      isAiGenerated={pageData.isAiGenerated}
    />
  )
}
