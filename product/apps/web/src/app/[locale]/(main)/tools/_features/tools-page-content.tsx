import { getLocalizedUrl } from 'intlayer'
import { ArrowRight, Type } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { OtakuAside } from '@/app/[locale]/(main)/_features/otaku-aside'
import { PageHeader } from '@tenzyu/ui/page-header'
import { KoFiLink } from '@/app/[locale]/_features/shell/kofi-link'
import { Badge } from '@tenzyu/ui/badge'
import { Button } from '@tenzyu/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@tenzyu/ui/card'

const ICONS = {
  type: Type,
} as const

export function ToolsPageContent({ locale }: { locale: string }) {
  const content = useIntlayer('page-tools')
  const futureItems = content.overview.futureItems as ReadonlyArray<{
    value: string
  }>
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
        eyebrow="Tools"
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />

      <Card variant="quiet" className="gap-0 py-0">
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-semibold tracking-tight">
            {content.overview.title}
          </h2>
          <p className="text-muted-foreground text-sm leading-6">
            {content.overview.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">{content.overview.futureTitle}</span>
            {futureItems.map((item) => (
              <Badge key={item.value} variant="secondary">
                {item.value}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = ICONS[tool.icon as keyof typeof ICONS] ?? Type
          return (
            <Card
              key={tool.href.value}
              variant="interactive"
              className="h-full"
            >
              <CardHeader className="gap-3">
                <div className="flex items-center gap-3">
                  <div className="border-primary/20 bg-primary/10 text-primary flex size-10 items-center justify-center rounded-[var(--radius-lg)] border">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                </div>
                <CardDescription>{tool.description}</CardDescription>
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
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card variant="quiet" className="gap-0 py-0">
        <CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm">
          <p className="text-muted-foreground leading-6">
            {content.support.description}
          </p>
          <KoFiLink label={content.support.supportLabel.value} />
          <Button asChild variant="ghost" size="sm">
            <Link href={getLocalizedUrl('/blog', locale)}>
              {content.support.readBlogLabel}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
