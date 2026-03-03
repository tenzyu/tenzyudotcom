import { Type } from 'lucide-react'
import Link from 'next/link'

import { PageHeader } from '@/components/common/page-header'

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
          <Link
            key={tool.href}
            href={tool.href}
            className="group border-border/50 bg-card hover:bg-accent hover:border-primary/30 flex flex-col justify-center gap-4 rounded-xl border p-5 shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <tool.icon className="text-muted-foreground group-hover:text-primary h-6 w-6 transition-colors" />
                <span className="text-card-foreground group-hover:text-primary font-medium transition-colors">
                  {tool.title}
                </span>
              </div>
              <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                &rarr;
              </span>
            </div>
            {tool.description && (
              <span className="text-muted-foreground text-xs leading-relaxed">
                {tool.description}
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  )
}
