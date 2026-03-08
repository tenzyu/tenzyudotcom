export type DashboardLink = {
  id: string
  url: string
  isApp?: boolean
}

export type DashboardCategory = {
  id: string
  links: readonly DashboardLink[]
}

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
  const parsed = new URL(url)
  const protocol = parsed.protocol
  const isWebUrl = protocol === 'https:' || protocol === 'http:'

  if (!isWebUrl && !isApp) {
    throw new Error(`${label} uses a custom scheme but isApp is not set`)
  }
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
