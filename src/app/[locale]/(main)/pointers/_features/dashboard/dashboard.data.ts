import {
  type DashboardCategory,
  defineDashboardCategories,
} from './dashboard.contract'

export const DASHBOARD_DATA: readonly DashboardCategory[] =
  defineDashboardCategories([
    {
      title: 'AI Assistants',
      links: [
        {
          name: 'Gemini',
          url: 'https://gemini.google.com/app',
          description: 'Google Advanced AI',
        },
        {
          name: 'ChatGPT',
          url: 'https://chat.openai.com/',
          description: 'OpenAI GPT-4',
        },
        { name: 'Grok', url: 'https://x.com/i/grok', description: 'xAI' },
        {
          name: 'Claude',
          url: 'https://claude.ai/',
          description: 'Anthropic Claude',
        },
      ],
    },
    {
      title: 'Productivity',
      links: [
        { name: 'Todoist (Web)', url: 'https://todoist.com/app/' },
        { name: 'Todoist (App)', url: 'todoist://', isApp: true },
        { name: 'Obsidian (App)', url: 'obsidian://', isApp: true },
        { name: 'GitHub', url: 'https://github.com/' },
      ],
    },
  ])
