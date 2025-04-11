import { getBlogPosts } from '@/lib/blog/getBlogPosts'

export const baseUrl = 'https://tenzyu.com'

export default async function sitemap() {
  const routes = ['', '/blog', '/u'].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  const awaited_blogs = await getBlogPosts()
  const blogs = awaited_blogs.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
  }))

  return [...routes, ...blogs]
}
