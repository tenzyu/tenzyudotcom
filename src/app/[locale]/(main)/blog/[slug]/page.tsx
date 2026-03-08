import { notFound } from 'next/navigation'
import { getLocale } from 'next-intlayer/server'
import { BlogPostPageContent } from './_features/blog-post-page-content'
import {
  buildBlogPostMetadata,
  getBlogPostBySlug,
  getBlogStaticParams,
} from './_features/lib/blog-post'

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
  const post = await getBlogPostBySlug(slug)
  if (!post) return

  return buildBlogPostMetadata(post, locale)
}

export default async function Blog({ params }: { params: Params }) {
  const locale = await getLocale()
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return <BlogPostPageContent locale={locale} post={post} />
}
