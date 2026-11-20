import { getMultilingualUrls } from 'intlayer'
import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { BASE_URL } from '@/config/site'
import { STATIC_SITEMAP_ROUTE_PATHS } from '@/config/site-policy'
import { loadBlogPosts } from '@/app/[locale]/(main)/blog/_features/blog.assemble'
import { loadPublishedNoteIds } from '@/app/[locale]/(main)/notes/_features/notes.assemble'
import { loadPublicScraps } from '@/app/[locale]/(main)/scraps/_features/scraps.assemble'
import { loadPublication } from '@/lib/content-store/publication.assemble'

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  await connection()
  const snapshot = await loadPublication()
  const [posts, noteIds, scrapEntries] = await Promise.all([
    loadBlogPosts(snapshot),
    loadPublishedNoteIds(snapshot),
    loadPublicScraps(),
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

  const scrapsWithAlternates = scrapEntries.map(
    (scrap): MetadataRoute.Sitemap[number] => {
      const route = `/scraps/${scrap.slug}`
      const allLanguages = getMultilingualUrls(`${BASE_URL}${route}`) as Record<
        string,
        string
      >
      const indexableLanguageEntries: Array<[string, string]> = []
      for (const locale of scrap.indexableLocales) {
        const localeKey = locale as string
        const url = allLanguages[localeKey]
        if (typeof url === 'string') {
          indexableLanguageEntries.push([localeKey, url])
        }
      }
      const indexableLanguages = Object.fromEntries(indexableLanguageEntries)

      return {
        url: `${BASE_URL}${route}`,
        lastModified: scrap.updatedAt,
        alternates: {
          languages:
            Object.keys(indexableLanguages).length > 0
              ? {
                  ...indexableLanguages,
                  'x-default': `${BASE_URL}${route}`,
                }
              : undefined,
        },
      }
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
