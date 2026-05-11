import { getLocalizedUrl } from 'intlayer'
import {
  ChevronRight,
  FileText,
  FolderArchive,
  Hammer,
  Link as LinkIcon,
  ListMusic,
  MessageSquareText,
  Pointer,
  Puzzle,
  BriefcaseBusiness,
} from 'lucide-react'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import type { ReactNode } from 'react'
import { Content } from '@tenzyu/ui/content'
import { SectionHeader } from '@tenzyu/ui/section-header'
import { Card, CardContent } from '@tenzyu/ui/card'
import {
  PUBLIC_ROUTE_GROUPS,
  PUBLIC_ROUTES,
  type PublicRouteId,
} from '@/features/site-navigation/public-routes.data'

const NAVIGATION_ITEM_ICONS = {
  tools: Hammer,
  blog: FileText,
  notes: MessageSquareText,
  portfolio: BriefcaseBusiness,
  archives: FolderArchive,
  links: LinkIcon,
  puzzles: Puzzle,
  recommendations: ListMusic,
  pointers: Pointer,
} as const

type NavigationItemContent = {
  label: ReactNode
  description: ReactNode
}

export function NavigationTiles() {
  const navigation = useIntlayer('navigationTiles')
  const home = useIntlayer('page-home')
  const { locale } = useLocale()

  return (
    <Content size="2xl" className="space-y-12">
      <SectionHeader
        title={home.siteIndexTitle}
        description={home.siteIndexSubtitle}
      />

      {PUBLIC_ROUTE_GROUPS.map((group) => {
        const groupContent = navigation.groups[group.id]
        const itemContents = groupContent.items as unknown as Partial<
          Record<PublicRouteId, NavigationItemContent>
        >

        return (
          <section key={group.id} className="space-y-5">
            <SectionHeader
              title={groupContent.title}
              description={groupContent.subtitle}
              titleClassName="text-xl"
            />

            <div className="grid gap-3 md:grid-cols-2">
              {group.routeIds.map((routeId) => {
                const itemContent = itemContents[routeId]
                const Icon = NAVIGATION_ITEM_ICONS[routeId]
                if (!itemContent) return null

                return (
                  <Card
                    key={routeId}
                    asChild
                    variant="interactive"
                    className="group gap-0 py-0"
                  >
                    <Link
                      href={getLocalizedUrl(
                        PUBLIC_ROUTES[routeId].href,
                        locale,
                      )}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="border-primary/20 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border transition-colors">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold tracking-tight">
                            {itemContent.label}
                          </h3>
                          <p className="text-muted-foreground line-clamp-2 text-xs leading-5">
                            {itemContent.description}
                          </p>
                        </div>
                        <ChevronRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </CardContent>
                    </Link>
                  </Card>
                )
              })}
            </div>
          </section>
        )
      })}
    </Content>
  )
}
