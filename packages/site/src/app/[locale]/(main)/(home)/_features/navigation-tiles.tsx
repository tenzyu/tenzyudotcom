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
  Sparkles,
  BriefcaseBusiness,
  LibraryBig,
} from 'lucide-react'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import type { ReactNode } from 'react'
import { Content } from '@/app/[locale]/_features/content'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { Separator } from '@/components/ui/separator'
import {
  PUBLIC_ROUTE_GROUPS,
  PUBLIC_ROUTES,
  type PublicRouteId,
} from '@/features/site-navigation/public-routes.data'

const NAVIGATION_GROUP_ICONS = {
  core: LibraryBig,
  around: Sparkles,
} as const

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
    <Content size="5xl" className="space-y-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {home.siteIndexTitle}
        </h2>
        <p className="text-muted-foreground text-sm font-medium">
          {home.siteIndexSubtitle}
        </p>
      </div>

      {PUBLIC_ROUTE_GROUPS.map((group) => {
        const groupContent = navigation.groups[group.id]
        const GroupIcon = NAVIGATION_GROUP_ICONS[group.id]
        const itemContents = groupContent.items as unknown as Partial<
          Record<PublicRouteId, NavigationItemContent>
        >

        return (
          <section key={group.id} className="space-y-6">
            {/* header */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
                  <GroupIcon className="text-primary h-7 w-7" />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {groupContent.title}
                    </h2>
                    <Separator className="bg-border/50 flex-1" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {groupContent.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* content */}
            <ItemGroup className="grid gap-3 md:grid-cols-2">
              {group.routeIds.map((routeId) => {
                const itemContent = itemContents[routeId]
                const Icon = NAVIGATION_ITEM_ICONS[routeId]
                if (!itemContent) return null

                return (
                  <Item
                    key={routeId}
                    variant="card"
                    size="sm"
                    className="group h-auto w-full"
                    asChild
                  >
                    <Link
                      href={getLocalizedUrl(PUBLIC_ROUTES[routeId].href, locale)}
                      className="flex w-full items-center gap-3"
                    >
                      <ItemMedia
                        variant="icon"
                        className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        <Icon className="h-4 w-4" />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="text-sm font-semibold">
                          {itemContent.label}
                        </ItemTitle>
                        <ItemDescription className="text-xs">
                          {itemContent.description}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="text-muted-foreground/80">
                        <ChevronRight className="h-4 w-4" />
                      </ItemActions>
                    </Link>
                  </Item>
                )
              })}
            </ItemGroup>
          </section>
        )
      })}
    </Content>
  )
}
