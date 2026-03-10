import type {
  DashboardCategory,
  DashboardCategoryId,
  DashboardLinkId,
} from './dashboard.domain'
import {
  defineDashboardCategories,
  pointersRepository,
} from './dashboard.contract'
import type { PointersRepository } from './dashboard.port'

type EditorialLocale = 'ja' | 'en'

function resolveEditorialLocale(locale: string): EditorialLocale {
  return locale === 'ja' ? 'ja' : 'en'
}

export class LoadPointersUseCase {
  constructor(private repository: PointersRepository) {}

  async execute(): Promise<readonly DashboardCategory[]> {
    const sourceCategories = await this.repository.loadAll()
    return defineDashboardCategories(
      sourceCategories.map((category) => ({
        id: category.id,
        links: category.links.map((link) => ({
          id: link.id,
          url: link.url,
          isApp: link.isApp,
        })),
      })),
    )
  }
}

export function makeLoadPointersUseCase() {
  return new LoadPointersUseCase(pointersRepository)
}

export async function assembleDashboardContent(locale: string) {
  const editorialLocale = resolveEditorialLocale(locale)
  const useCase = makeLoadPointersUseCase()
  const sourceCategories = await pointersRepository.loadAll()
  const categories = await useCase.execute()

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
