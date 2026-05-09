import { getLocalizedUrl } from 'intlayer'
import { Type } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { OtakuAside } from '@/app/[locale]/(main)/_features/otaku-aside'
import { PageHeader } from '@/app/[locale]/_features/page-header'
import { KoFiLink } from '@/app/[locale]/_features/shell/kofi-link'
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
  const futureItems = content.overview.futureItems as ReadonlyArray<{ value: string }>
  const tools = content.tools as ReadonlyArray<{
    description: string
    href: { value: string }
    icon: string
    note: string
    title: string
  }>

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <section className="mb-6 space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          {content.overview.title}
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          {content.overview.description}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="font-medium">{content.overview.futureTitle}</span>
          <span className="text-muted-foreground">
            {futureItems.map((item) => item.value).join(' / ')}
          </span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
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

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <p className="text-muted-foreground leading-6">
          {content.support.description}
        </p>
        <KoFiLink label={content.support.supportLabel.value} />
        <Button asChild variant="ghost" size="sm">
          <Link href={getLocalizedUrl('/blog', locale)}>
            {content.support.readBlogLabel}
          </Link>
        </Button>
      </div>
    </>
  )
}
