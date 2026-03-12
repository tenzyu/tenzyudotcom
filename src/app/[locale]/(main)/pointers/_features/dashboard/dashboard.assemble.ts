import {
  defineDashboardCategories,
  type DashboardCategory,
  type DashboardCategoryId,
  type DashboardLinkId,
} from './dashboard.domain'
import { EditorPointersRepository } from './dashboard.infra'
import type { PointersRepository } from './dashboard.port'
import { makeEditorRepository } from '@/lib/editor/editor.assemble'

type EditorLocale = 'ja' | 'en'

function resolveEditorLocale(locale: string): EditorLocale {
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
  return new LoadPointersUseCase(
    new EditorPointersRepository(makeEditorRepository()),
  )
}

export async function assembleDashboardContent(locale: string) {
  const editorLocale = resolveEditorLocale(locale)
  const useCase = makeLoadPointersUseCase()
  const sourceCategories = await new EditorPointersRepository(
    makeEditorRepository(),
  ).loadAll()
  const categories = await useCase.execute()

  const categoryContent = Object.fromEntries(
    sourceCategories.map((category) => [
      category.id,
      {
        title: category.title[editorLocale],
        description: category.description[editorLocale],
      },
    ]),
  ) as Record<DashboardCategoryId, { title: string; description: string }>

  const links = Object.fromEntries(
    sourceCategories.flatMap((category) =>
      category.links.map((link) => [
        link.id,
        {
          title: link.title[editorLocale],
          description: link.description[editorLocale],
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
