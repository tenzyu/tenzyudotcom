import { notFound, redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getLocale } from 'next-intlayer/server'
import { BlogPostPageContent } from './_features/blog-post-page-content'
import {
  assembleBlogPostPageData,
  buildBlogPostMetadata,
} from '../_features/blog.assemble'
import { loadPublication } from '@/lib/content-store/publication.assemble'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'

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

  return (
    <BlogPostPageContent
      locale={locale}
      post={pageData.post}
      headings={pageData.headings}
      relatedPosts={pageData.relatedPosts}
      isAiGenerated={pageData.isAiGenerated}
    />
  )
}
