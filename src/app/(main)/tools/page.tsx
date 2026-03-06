import Link from 'next/link'
import { Type } from 'lucide-react'
import { getLocale } from 'next-intl/server'

import { PageHeader } from '@/components/site/page-header'
import { OtakuAside } from '@/components/site/otaku-aside'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TOOLS } from '@/data/tools'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Tools',
  description: '自作したツールや便利スクリプトの公開用ページ',
}

const ICONS = {
  type: Type,
} as const

export default async function ToolsPage() {
  const locale = await getLocale()
  const isJa = locale === 'ja'
  const commentLabel = isJa ? 'ひとことコメント' : 'Quick comment'

  return (
    <>
      <PageHeader
        title="Tools"
        description="自作したツールや便利スクリプトの公開用ページ"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map((tool) => {
          const Icon = ICONS[tool.icon]
          return (
            <Card key={tool.href} variant="soft" className="h-full">
              <CardHeader className="gap-2">
                <div className="flex items-center gap-3">
                  <Icon className="text-primary h-5 w-5" />
                  <CardTitle className="text-lg">
                    {isJa ? tool.title.ja : tool.title.en}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {isJa ? tool.description.ja : tool.description.en}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <OtakuAside label={commentLabel}>
                  {isJa ? tool.note.ja : tool.note.en}
                </OtakuAside>
                <Button asChild variant="soft" size="sm">
                  <Link href={tool.href}>Open tool</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
