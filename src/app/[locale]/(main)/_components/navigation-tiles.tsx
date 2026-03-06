import {
  Disc,
  FileText,
  FolderArchive,
  Hammer,
  Pointer,
  Puzzle,
  ChevronRight,
  Sparkles,
  User,
  ListMusic,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { getLocalizedUrl } from 'intlayer'

import { Separator } from '@/components/ui/separator'
import { Content } from '@/components/site/content'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

const NAV_GROUPS = [
  {
    icon: User,
    items: [Hammer, FileText, Disc, FolderArchive],
  },
  {
    icon: Sparkles,
    items: [LinkIcon, Puzzle, ListMusic, Pointer],
  },
] as const

export function NavigationTiles() {
  const navigation = useIntlayer('navigationTiles')
  const { locale } = useLocale()

  return (
    <Content size="5xl" className="space-y-12">
      {navigation.groups.map((group, groupIndex) => {
        const config = NAV_GROUPS[groupIndex]
        if (!config) return null

        return (
          <section key={group.title.value} className="space-y-6">
            {/* header */}
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
                  <config.icon className="text-primary h-7 w-7" />
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {group.title}
                    </h2>
                    <Separator className="bg-border/50 flex-1" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">
                    {group.subtitle}
                  </p>
                </div>
              </div>
            </div>

            {/* content */}
            <ItemGroup className="grid gap-3 md:grid-cols-2">
              {group.items.map((item, itemIndex) => {
                const Icon = config.items[itemIndex]
                if (!Icon) return null

                return (
                  <Item
                    key={item.href.value}
                    variant="card"
                    size="sm"
                    className="group h-auto w-full"
                    asChild
                  >
                    <Link
                      href={getLocalizedUrl(item.href.value, locale)}
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
                          {item.label}
                        </ItemTitle>
                        <ItemDescription className="text-xs">
                          {item.description}
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
