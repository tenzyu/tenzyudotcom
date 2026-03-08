export type DashboardLink = {
  name: string
  url: string
  description?: string
  isApp?: boolean
}

export type DashboardCategory = {
  title: string
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
  const categoryTitles = new Set<string>()

  for (const category of categories) {
    assertNonEmpty(category.title, 'dashboard category title')

    if (categoryTitles.has(category.title)) {
      throw new Error(`Duplicate dashboard category title: ${category.title}`)
    }
    categoryTitles.add(category.title)

    const linkNames = new Set<string>()
    for (const link of category.links) {
      assertNonEmpty(link.name, `dashboard link name in ${category.title}`)
      assertDashboardUrl(
        link.url,
        link.isApp,
        `dashboard link url for ${category.title}/${link.name}`,
      )

      if (linkNames.has(link.name)) {
        throw new Error(
          `Duplicate dashboard link name in ${category.title}: ${link.name}`,
        )
      }
      linkNames.add(link.name)
    }
  }

  return categories
}
