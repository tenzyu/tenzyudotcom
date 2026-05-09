import { getLocalizedUrl } from 'intlayer'
import { ArrowRight, BriefcaseBusiness, Sparkles, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/app/[locale]/_features/content'
import { SectionHeader } from '@/app/[locale]/(main)/_features/section-header'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const PATHWAY_ICONS = [UserRound, Sparkles, BriefcaseBusiness] as const

export function HomePathways({ locale }: { locale: string }) {
  const home = useIntlayer('page-home')
  const pathways = home.pathways as ReadonlyArray<{
    description: { value: string } | string
    links: ReadonlyArray<{
      href: { value: string }
      label: string
    }>
    title: { value: string } | string
  }>

  return (
    <Content size="5xl" className="space-y-6">
      <SectionHeader
        title={home.pathwaysTitle.value}
        description={home.pathwaysSubtitle.value}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {pathways.map((pathway, index) => {
          const Icon = PATHWAY_ICONS[index] ?? Sparkles
          const title = typeof pathway.title === 'string' ? pathway.title : pathway.title.value
          const description =
            typeof pathway.description === 'string'
              ? pathway.description
              : pathway.description.value

          return (
            <Card key={title} variant="soft" className="h-full">
              <CardHeader className="gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-2xl">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg leading-snug">
                    {title}
                  </CardTitle>
                  <CardDescription className="leading-relaxed">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {pathway.links.map((link) => (
                  <Button key={link.href.value} asChild variant="outline" size="sm">
                    <Link href={getLocalizedUrl(link.href.value, locale)}>
                      {link.label}
                      <ArrowRight />
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </Content>
  )
}
