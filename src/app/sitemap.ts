import { getLocalizedUrl, locales } from 'intlayer'

import { getBlogPosts } from '@/lib/blog/getBlogPosts'

export const baseUrl = 'https://tenzyu.com'

export default async function sitemap() {
  const routes = [
    '/',
    '/blog',
    '/links',
    '/tools',
    '/portfolio',
    '/archives',
    '/puzzles',
    '/recommendations',
  ]

  const routesByLocale = routes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}${getLocalizedUrl(route, locale)}`,
      lastModified: new Date().toISOString().split('T')[0],
    })),
  )

  const awaited_blogs = await getBlogPosts()
  const blogs = awaited_blogs.flatMap((post) =>
    locales.map((locale) => ({
      url: `${baseUrl}${getLocalizedUrl(`/blog/${post.slug}`, locale)}`,
      lastModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
    })),
  )

  return [...routesByLocale, ...blogs]
}
