import { type Dictionary, t } from 'intlayer'
import type {
  DashboardCategoryId,
  DashboardLinkId,
} from './_features/dashboard/dashboard.data'

const pointersPageContent = {
  key: 'page-pointers',
  content: {
    metadata: {
      title: t({
        ja: 'ポインタ',
        en: 'Pointers',
      }),
      description: t({
        ja: '日常用のクイックアクセスダッシュボード。',
        en: 'Quick access dashboard for personal daily use.',
      }),
    },
    dashboard: {
      categories: {
        'ai-assistants': {
          title: t({
            ja: 'AI アシスタント',
            en: 'AI assistants',
          }),
          description: t({
            ja: 'よく開く会話型 AI の入口。',
            en: 'Fast entry points to the AI tools I open most often.',
          }),
        },
        productivity: {
          title: t({
            ja: '生産性',
            en: 'Productivity',
          }),
          description: t({
            ja: '作業と整理に使う定番ツール。',
            en: 'Default tools for planning, notes, and work.',
          }),
        },
      } satisfies Record<
        DashboardCategoryId,
        {
          title: ReturnType<typeof t>
          description: ReturnType<typeof t>
        }
      >,
      links: {
        gemini: {
          title: t({
            ja: 'Gemini',
            en: 'Gemini',
          }),
          description: t({
            ja: 'Google の対話型 AI。',
            en: 'Google conversational AI.',
          }),
        },
        chatgpt: {
          title: t({
            ja: 'ChatGPT',
            en: 'ChatGPT',
          }),
          description: t({
            ja: 'OpenAI の対話型 AI。',
            en: 'OpenAI conversational AI.',
          }),
        },
        grok: {
          title: t({
            ja: 'Grok',
            en: 'Grok',
          }),
          description: t({
            ja: 'xAI の対話型 AI。',
            en: 'xAI conversational AI.',
          }),
        },
        claude: {
          title: t({
            ja: 'Claude',
            en: 'Claude',
          }),
          description: t({
            ja: 'Anthropic の対話型 AI。',
            en: 'Anthropic conversational AI.',
          }),
        },
        'todoist-web': {
          title: t({
            ja: 'Todoist Web',
            en: 'Todoist Web',
          }),
          description: t({
            ja: 'ブラウザで開く Todoist。',
            en: 'Todoist in the browser.',
          }),
        },
        'todoist-app': {
          title: t({
            ja: 'Todoist App',
            en: 'Todoist App',
          }),
          description: t({
            ja: 'アプリで開く Todoist。',
            en: 'Todoist via the app protocol.',
          }),
        },
        'obsidian-app': {
          title: t({
            ja: 'Obsidian App',
            en: 'Obsidian App',
          }),
          description: t({
            ja: 'ローカルノートをすぐ開く。',
            en: 'Jump straight into local notes.',
          }),
        },
        github: {
          title: t({
            ja: 'GitHub',
            en: 'GitHub',
          }),
          description: t({
            ja: 'コードと issue の入口。',
            en: 'Entry point for code and issues.',
          }),
        },
      } satisfies Record<
        DashboardLinkId,
        {
          title: ReturnType<typeof t>
          description: ReturnType<typeof t>
        }
      >,
    },
  },
} satisfies Dictionary

export default pointersPageContent
