import { normalizeExternalUrl } from '@/lib/url/external-url.contract'
import { z } from 'zod'
import { editorialRepository } from '@/lib/editorial/editorial.contract'
import type {
  DashboardCategory,
  DashboardLink,
  DashboardSourceCategory,
} from './dashboard.domain'
import type { PointersRepository } from './dashboard.port'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().min(1),
})

const DashboardSourceLinkSchema = z.object({
  id: z.string().trim().min(1),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  url: z.string().trim().min(1),
  isApp: z.boolean().optional(),
})

const DashboardSourceCategorySchema = z.object({
  id: z.string().trim().min(1),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema,
  links: z.array(DashboardSourceLinkSchema),
})

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must not be empty`)
  }
}

function assertDashboardUrl(
  url: string,
  isApp: boolean | undefined,
  label: string,
) {
  if (isApp) {
    const parsed = new URL(url)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      throw new Error(`${label} is marked as app but uses http(s)`)
    }

    return
  }

  normalizeExternalUrl(url, label)
}

export function defineDashboardCategories<const T extends DashboardCategory>(
  categories: readonly T[],
): readonly T[] {
  const categoryIds = new Set<string>()
  const linkIds = new Set<string>()

  for (const category of categories) {
    assertNonEmpty(category.id, 'dashboard category id')

    if (categoryIds.has(category.id)) {
      throw new Error(`Duplicate dashboard category id: ${category.id}`)
    }
    categoryIds.add(category.id)

    for (const link of category.links) {
      assertNonEmpty(link.id, `dashboard link id in ${category.id}`)
      assertDashboardUrl(
        link.url,
        link.isApp,
        `dashboard link url for ${category.id}/${link.id}`,
      )

      if (linkIds.has(link.id)) {
        throw new Error(`Duplicate dashboard link id: ${link.id}`)
      }
      linkIds.add(link.id)
    }
  }

  return categories
}

export function parseDashboardSourceCategories(raw: unknown) {
  const categories = z.array(DashboardSourceCategorySchema).parse(raw)

  for (const category of categories) {
    for (const link of category.links) {
      assertDashboardUrl(
        link.url,
        link.isApp,
        `dashboard source url for ${category.id}/${link.id}`,
      )
    }
  }

  return categories
}

export class EditorialPointersRepository implements PointersRepository {
  async loadAll(): Promise<readonly DashboardSourceCategory[]> {
    const { collection } = await editorialRepository.loadState('pointers')
    return collection
  }
}

export const pointersRepository = new EditorialPointersRepository()
