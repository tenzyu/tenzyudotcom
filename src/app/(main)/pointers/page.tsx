import { PageHeader } from '@/components/common/page-header'

import type { Metadata } from 'next'

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
                <a
                  key={link.name}
                  href={link.url}
                  target={link.isApp ? '_self' : '_blank'}
                  rel={link.isApp ? '' : 'noopener noreferrer'}
                  className="group border-border/50 bg-card hover:bg-accent hover:border-primary/30 flex flex-col justify-center rounded-xl border p-5 shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-card-foreground group-hover:text-primary font-medium transition-colors">
                      {link.name}
                    </span>
                    <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      &rarr;
                    </span>
                  </div>
                  {link.description && (
                    <span className="text-muted-foreground mt-1 text-xs">
                      {link.description}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
