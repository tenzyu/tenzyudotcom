import { getLocalizedUrl } from 'intlayer'
import { Type } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { OtakuAside } from '@/app/[locale]/(main)/_features/otaku-aside'
import { PageHeader } from '@/app/[locale]/_features/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ICONS = {
  type: Type,
} as const

export function ToolsPageContent({ locale }: { locale: string }) {
  const content = useIntlayer('page-tools')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {content.tools.map((tool) => {
          const Icon = ICONS[tool.icon as keyof typeof ICONS] ?? Type
          return (
            <Card key={tool.href.value} variant="soft" className="h-full">
              <CardHeader className="gap-2">
                <div className="flex items-center gap-3">
                  <Icon className="text-primary h-5 w-5" />
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <OtakuAside label={content.labels.comment.value}>
                  {tool.note}
                </OtakuAside>
                <Button
                  asChild
                  variant="soft"
                  size="sm"
                  className="w-full justify-center"
                >
                  <Link href={getLocalizedUrl(tool.href.value, locale)}>
                    {content.labels.openTool.value}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
