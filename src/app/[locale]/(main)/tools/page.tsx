import { getLocalizedUrl } from 'intlayer'
import { Type } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  getIntlayer,
  type LocalPromiseParams,
  type NextPageIntlayer,
} from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { OtakuAside } from '@/components/site/otaku-aside'
import { PageHeader } from '@/components/site/page-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('toolsPage', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

const ICONS = {
  type: Type,
} as const

const ToolsPage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = getIntlayer('toolsPage', locale)

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

export default ToolsPage
