type LocalizedText = {
  ja: string
  en: string
}

export type DashboardCategoryId = string

export type DashboardLinkId = string

export type DashboardSourceLink = {
  id: DashboardLinkId
  title: LocalizedText
  description: LocalizedText
  url: string
  isApp?: boolean
}

export type DashboardSourceCategory = {
  id: DashboardCategoryId
  title: LocalizedText
  description: LocalizedText
  links: readonly DashboardSourceLink[]
}

export type DashboardLink = {
  id: string
  url: string
  isApp?: boolean
}

export type DashboardCategory = {
  id: string
  links: readonly DashboardLink[]
}
