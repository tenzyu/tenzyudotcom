import type { DashboardCategoryId, DashboardLinkId } from './dashboard.source'
import { defineDashboardCategories } from './dashboard.contract'
import { loadEditorialCollection } from '@/lib/editorial/storage'

type EditorialLocale = 'ja' | 'en'

function resolveEditorialLocale(locale: string): EditorialLocale {
  return locale === 'ja' ? 'ja' : 'en'
}

export async function assembleDashboardContent(locale: string) {
  const editorialLocale = resolveEditorialLocale(locale)
  const sourceCategories = await loadEditorialCollection('pointers')
  const categories = defineDashboardCategories(
    sourceCategories.map((category) => ({
      id: category.id,
      links: category.links.map((link) => ({
        id: link.id,
        url: link.url,
        isApp: link.isApp,
      })),
    })),
  ) satisfies ReadonlyArray<{
    id: DashboardCategoryId
    links: ReadonlyArray<{
      id: DashboardLinkId
      url: string
      isApp?: boolean
    }>
  }>

  const categoryContent = Object.fromEntries(
    sourceCategories.map((category) => [
      category.id,
      {
        title: category.title[editorialLocale],
        description: category.description[editorialLocale],
      },
    ]),
  ) as Record<DashboardCategoryId, { title: string; description: string }>

  const links = Object.fromEntries(
    sourceCategories.flatMap((category) =>
      category.links.map((link) => [
        link.id,
        {
          title: link.title[editorialLocale],
          description: link.description[editorialLocale],
        },
      ]),
    ),
  ) as Record<DashboardLinkId, { title: string; description: string }>

  return {
    categories,
    categoryContent,
    links,
  }
}
