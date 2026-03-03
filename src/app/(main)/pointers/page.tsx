import { ActionLinkCard } from '@/components/common/action-link-card'
import { PageHeader } from '@/components/common/page-header'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Pointers | Dashboard',
  robots: {
    index: false,
    follow: false,
  },
}

type LinkItem = {
  name: string
  url: string
  description?: string
  isApp?: boolean
}

type Category = {
  title: string
  links: LinkItem[]
}

const DASHBOARD_DATA: Category[] = [
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
]

export default function PointersPage() {
  return (
    <>
      <PageHeader
        title="Pointers"
        description="Quick access dashboard for personal daily use."
        className="space-y-4"
      />

      <div className="grid gap-12 md:grid-cols-2">
        {DASHBOARD_DATA.map((category) => (
          <section key={category.title} className="space-y-6">
            <h2 className="text-lg font-semibold">{category.title}</h2>
            <div className="grid gap-4">
              {category.links.map((link) => (
                <ActionLinkCard
                  key={link.name}
                  title={link.name}
                  description={link.description}
                  href={link.url}
                  internal={!!link.isApp}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
