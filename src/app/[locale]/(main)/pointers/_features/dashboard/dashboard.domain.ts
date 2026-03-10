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

export const DASHBOARD_SOURCE_CATEGORIES: readonly DashboardSourceCategory[] = [
  {
    id: 'ai-assistants',
    title: {
      ja: 'AI アシスタント',
      en: 'AI assistants',
    },
    description: {
      ja: 'よく開く会話型 AI の入口。',
      en: 'Fast entry points to the AI tools I open most often.',
    },
    links: [
      {
        id: 'gemini',
        title: {
          ja: 'Gemini',
          en: 'Gemini',
        },
        description: {
          ja: 'Google の対話型 AI。',
          en: 'Google conversational AI.',
        },
        url: 'https://gemini.google.com/app',
      },
      {
        id: 'chatgpt',
        title: {
          ja: 'ChatGPT',
          en: 'ChatGPT',
        },
        description: {
          ja: 'OpenAI の対話型 AI。',
          en: 'OpenAI conversational AI.',
        },
        url: 'https://chat.openai.com/',
      },
      {
        id: 'grok',
        title: {
          ja: 'Grok',
          en: 'Grok',
        },
        description: {
          ja: 'xAI の対話型 AI。',
          en: 'xAI conversational AI.',
        },
        url: 'https://x.com/i/grok',
      },
      {
        id: 'claude',
        title: {
          ja: 'Claude',
          en: 'Claude',
        },
        description: {
          ja: 'Anthropic の対話型 AI。',
          en: 'Anthropic conversational AI.',
        },
        url: 'https://claude.ai/',
      },
    ],
  },
  {
    id: 'productivity',
    title: {
      ja: '生産性',
      en: 'Productivity',
    },
    description: {
      ja: '作業と整理に使う定番ツール。',
      en: 'Default tools for planning, notes, and work.',
    },
    links: [
      {
        id: 'todoist-web',
        title: {
          ja: 'Todoist Web',
          en: 'Todoist Web',
        },
        description: {
          ja: 'ブラウザで開く Todoist。',
          en: 'Todoist in the browser.',
        },
        url: 'https://todoist.com/app/',
      },
      {
        id: 'todoist-app',
        title: {
          ja: 'Todoist App',
          en: 'Todoist App',
        },
        description: {
          ja: 'アプリで開く Todoist。',
          en: 'Todoist via the app protocol.',
        },
        url: 'todoist://',
        isApp: true,
      },
      {
        id: 'obsidian-app',
        title: {
          ja: 'Obsidian App',
          en: 'Obsidian App',
        },
        description: {
          ja: 'ローカルノートをすぐ開く。',
          en: 'Jump straight into local notes.',
        },
        url: 'obsidian://',
        isApp: true,
      },
      {
        id: 'github',
        title: {
          ja: 'GitHub',
          en: 'GitHub',
        },
        description: {
          ja: 'コードと issue の入口。',
          en: 'Entry point for code and issues.',
        },
        url: 'https://github.com/',
      },
    ],
  },
]
