export type LinkCategory = 'Watch' | 'Social' | 'Build' | 'Legacy'

export type MyLink = {
  name: string
  id: string
  url: string
  shortenUrl: string
  icon: string
  category: LinkCategory
}

export const LINK_CATEGORY_ORDER = [
  'Watch',
  'Social',
  'Build',
  'Legacy',
] as const satisfies readonly LinkCategory[]
