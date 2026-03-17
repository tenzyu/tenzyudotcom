import { z } from 'zod'
import {
  loadJsonCollection,
  saveJsonCollection,
} from '@/lib/content-store/json-document.infra'
import { normalizeExternalUrl } from '@/lib/url/external-url.domain'
import type {
  DashboardSourceCategory,
} from './dashboard.domain'
import type { PointersRepository } from './dashboard.port'
const POINTERS_STORAGE_PATH = 'editor/pointers.json'

const LocalizedTextSchema = z.object({
  ja: z.string().trim().min(1),
  en: z.string().trim().optional().default(''),
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

export function parseDashboardSourceCategories(raw: unknown) {
  const categories = z.array(DashboardSourceCategorySchema).parse(raw)
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

export async function loadPointersState() {
  return loadJsonCollection(
    POINTERS_STORAGE_PATH,
    parseDashboardSourceCategories,
    () => [] as readonly DashboardSourceCategory[],
  )
}

export async function savePointersState(
  rawJson: string,
  expectedVersion?: string,
) {
  return saveJsonCollection(
    POINTERS_STORAGE_PATH,
    rawJson,
    parseDashboardSourceCategories,
    expectedVersion,
  )
}

export class PointersStorageRepository implements PointersRepository {
  async loadAll(): Promise<readonly DashboardSourceCategory[]> {
    const { collection } = await loadPointersState()
    return collection
  }
}

export function makePointersRepository() {
  return new PointersStorageRepository()
}
