import Link from 'next/link'
import { Type } from 'lucide-react'
import { getLocalizedUrl } from 'intlayer'
import {
  IntlayerServerProvider,
  getLocale,
  useIntlayer,
} from 'next-intlayer/server'

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

export const dynamic = 'force-static'

export async function generateMetadata() {
  const locale = await getLocale()
  const content = useIntlayer('toolsPage', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

const ICONS = {
  type: Type,
} as const

export default async function ToolsPage() {
  const locale = await getLocale()
  const content = useIntlayer('toolsPage', locale)

  return (
    <IntlayerServerProvider locale={locale}>
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
              <CardContent className="space-y-3 text-sm">
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
                    {content.labels.openTool}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </IntlayerServerProvider>
  )
}
