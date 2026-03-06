import { Type } from 'lucide-react'

import { ActionLinkTile } from '@/components/site/action-link-tile'
import { PageHeader } from '@/components/site/page-header'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Tools',
  description: '自作したツールや便利スクリプトの公開用ページ',
}

const TOOLS_DATA = [
  {
    title: 'Dot Type Generator',
    description: 'テキストをドット絵風のアスキーアートに変換するジェネレーター',
    href: '/tools/dot-type',
    icon: Type,
  },
]

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        title="Tools"
        description="自作したツールや便利スクリプトの公開用ページ"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS_DATA.map((tool) => (
          <ActionLinkTile
            key={tool.href}
            title={tool.title}
            description={tool.description}
            href={tool.href}
            icon={tool.icon}
          />
        ))}
      </div>
    </>
  )
}
