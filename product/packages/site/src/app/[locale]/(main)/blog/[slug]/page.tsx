import { notFound } from 'next/navigation'
import { getLocale } from 'next-intlayer/server'
import { BlogPostPageContent } from './_features/blog-post-page-content'
import {
  assembleBlogPostPageData,
  buildBlogPostMetadata,
  getBlogStaticParams,
} from '../_features/blog.assemble'

export const dynamicParams = false

export async function generateStaticParams() {
  return getBlogStaticParams()
}

type Params = Promise<{
  slug: string
}>

export async function generateMetadata({ params }: { params: Params }) {
  const locale = await getLocale()
  const { slug } = await params
  const pageData = await assembleBlogPostPageData(slug)
  const post = pageData?.post
  if (!post) return

  return buildBlogPostMetadata(post, locale)
}

export default async function Blog({ params }: { params: Params }) {
  const locale = await getLocale()
  const { slug } = await params
  const pageData = await assembleBlogPostPageData(slug)

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
