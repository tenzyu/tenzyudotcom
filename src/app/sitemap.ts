import { getMultilingualUrls } from 'intlayer'
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/config/site'
import { getBlogPosts } from '@/lib/blog/getBlogPosts'

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
      url: `${BASE_URL}${route}`,
      lastModified: new Date().toISOString().split('T')[0],
      alternates: {
        languages: {
          ...getMultilingualUrls(`${BASE_URL}${route}`),
          'x-default': `${BASE_URL}${route}`,
        },
      },
    }),
  )

  const awaited_blogs = await getBlogPosts()
  const blogsWithAlternates = awaited_blogs.map(
    (post): MetadataRoute.Sitemap[number] => {
      const route = `/blog/${post.slug}`
      return {
        url: `${BASE_URL}${route}`,
        lastModified: post.metadata.updatedAt ?? post.metadata.publishedAt,
        alternates: {
          languages: {
            ...getMultilingualUrls(`${BASE_URL}${route}`),
            'x-default': `${BASE_URL}${route}`,
          },
        },
      }
    },
  )

  return [...routesWithAlternates, ...blogsWithAlternates]
}

export default sitemap
