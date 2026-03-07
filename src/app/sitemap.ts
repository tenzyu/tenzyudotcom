import { getMultilingualUrls } from 'intlayer'
import type { MetadataRoute } from 'next'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'

export const baseUrl = 'https://tenzyu.com'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  // NOTE: in [rocale]
  const routes = [
    '/',
    '/archives',
    '/blog',
    '/links',
    '/pointers',
    '/portfolio',
    '/puzzles',
    '/recommendations',
    '/tools',
  ]

  const routesWithAlternates = routes.map(
    (route): MetadataRoute.Sitemap[number] => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date().toISOString().split('T')[0],
      alternates: {
        languages: {
          ...getMultilingualUrls(`${baseUrl}${route}`),
          'x-default': `${baseUrl}${route}`,
        },
      },
    }),
  )

  const awaited_blogs = await getBlogPosts()
  const blogsWithAlternates = awaited_blogs.map(
    (post): MetadataRoute.Sitemap[number] => {
      const route = `/blog/${post.slug}`
      return {
        url: `${baseUrl}${route}`,
        lastModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
        alternates: {
          languages: {
            ...getMultilingualUrls(`${baseUrl}${route}`),
            'x-default': `${baseUrl}${route}`,
          },
        },
      }
    },
  )

  return [...routesWithAlternates, ...blogsWithAlternates]
}

export default sitemap
