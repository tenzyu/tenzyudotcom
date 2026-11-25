import { getMultilingualUrls } from 'intlayer'
import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { BASE_URL } from '@/config/site'
import { STATIC_SITEMAP_ROUTE_PATHS } from '@/config/site-policy'
import { loadBlogPosts } from '@/features/blog/blog.assemble'
import { loadPublishedNoteIds } from '@/features/notes/notes.assemble'
import {
  buildScrapAlternateLanguages,
  buildScrapDetailUrl,
  loadPublicScraps,
} from '@/features/scraps/scraps.assemble'
import { loadPublication } from '@/platform/content-store/publication.assemble'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  await connection()
  const snapshot = await loadPublication()
  const [posts, noteIds, scrapEntries] = await Promise.all([
    loadBlogPosts(snapshot),
    loadPublishedNoteIds(snapshot),
    loadPublicScraps(snapshot),
  ])
  const routesWithAlternates = STATIC_SITEMAP_ROUTE_PATHS.map(
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

  const blogsWithAlternates = posts.map(
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

  const notesWithAlternates = noteIds.map(
    (id): MetadataRoute.Sitemap[number] => {
      const route = `/notes/${id}`
      return {
        url: `${BASE_URL}${route}`,
        lastModified: new Date().toISOString().split('T')[0],
        alternates: {
          languages: {
            ...getMultilingualUrls(`${BASE_URL}${route}`),
            'x-default': `${BASE_URL}${route}`,
          },
        },
      }
    },
  )

  const scrapsWithAlternates = scrapEntries.flatMap(
    (scrap): MetadataRoute.Sitemap => {
      const locale = scrap.indexableLocales.includes('ja')
        ? 'ja'
        : scrap.indexableLocales[0]
      if (!locale) return []
      const url = buildScrapDetailUrl(scrap.slug, locale)
      return [
        {
          url,
          lastModified: scrap.updatedAt,
          alternates: {
            languages: {
              ...buildScrapAlternateLanguages(
                scrap.slug,
                scrap.indexableLocales,
              ),
              'x-default': url,
            },
          },
        },
      ]
    },
  )

  return [
    ...routesWithAlternates,
    ...blogsWithAlternates,
    ...notesWithAlternates,
    ...scrapsWithAlternates,
  ]
}

export default sitemap
