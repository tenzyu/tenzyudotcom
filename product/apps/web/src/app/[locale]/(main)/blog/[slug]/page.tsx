import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { getLocale } from 'next-intlayer/server'
import { BlogPostPageContent } from './_features/blog-post-page-content'
import {
  assembleBlogPostPageData,
  buildBlogPostMetadata,
} from '../_features/blog.assemble'
import { loadPublication } from '@/lib/content-store/publication.assemble'

type Params = Promise<{
  slug: string
}>

export async function generateMetadata({ params }: { params: Params }) {
  await connection()
  const locale = await getLocale()
  const { slug } = await params
  const pageData = await assembleBlogPostPageData(await loadPublication(), slug)
  const post = pageData?.post
  if (!post) return

  return buildBlogPostMetadata(post, locale)
}

export default async function Blog({ params }: { params: Params }) {
  await connection()
  const locale = await getLocale()
  const { slug } = await params
  const pageData = await assembleBlogPostPageData(await loadPublication(), slug)

  if (!pageData) {
    notFound()
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
