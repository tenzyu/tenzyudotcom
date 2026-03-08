import { defineDashboardCategories } from './dashboard.contract'

export type DashboardCategoryId = 'ai-assistants' | 'productivity'

export type DashboardLinkId =
  | 'gemini'
  | 'chatgpt'
  | 'grok'
  | 'claude'
  | 'todoist-web'
  | 'todoist-app'
  | 'obsidian-app'
  | 'github'

export const DASHBOARD_DATA = defineDashboardCategories([
    {
      id: 'ai-assistants',
      links: [
        { id: 'gemini', url: 'https://gemini.google.com/app' },
        { id: 'chatgpt', url: 'https://chat.openai.com/' },
        { id: 'grok', url: 'https://x.com/i/grok' },
        { id: 'claude', url: 'https://claude.ai/' },
      ],
    },
    {
      id: 'productivity',
      links: [
        { id: 'todoist-web', url: 'https://todoist.com/app/' },
        { id: 'todoist-app', url: 'todoist://', isApp: true },
        { id: 'obsidian-app', url: 'obsidian://', isApp: true },
        { id: 'github', url: 'https://github.com/' },
      ],
    },
  ]) satisfies ReadonlyArray<{
    id: DashboardCategoryId
    links: ReadonlyArray<{
      id: DashboardLinkId
      url: string
      isApp?: boolean
    }>
  }>
