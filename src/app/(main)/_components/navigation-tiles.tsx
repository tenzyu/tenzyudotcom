import {
  Disc,
  FileText,
  FolderArchive,
  Hammer,
  Pointer,
  Puzzle,
  ChevronUp,
  Sparkles,
  User,
  ListMusic,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'

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
import { FAVORITES_COPY } from '@/data/copies'

const NAV_GROUPS = [
  {
    title: 'Outputs',
    subtitle: 'What I do',
    icon: User,
    items: [
      {
        href: '/tools',
        label: 'Tools',
        description: '自作ツールやスクリプト。',
        icon: Hammer,
      },
      {
        href: '/blog',
        label: 'Blog',
        description: '書き留めたメモと記録。',
        icon: FileText,
      },
      {
        href: '/portfolio',
        label: 'Portfolio',
        description: '採用担当の方はこちら。',
        icon: Disc,
      },
      {
        href: '/archives',
        label: 'Archives',
        description: '過去のログとまとめ。',
        icon: FolderArchive,
      },
    ],
  },
  {
    title: 'Externals',
    subtitle: 'Jump to external resources',
    icon: Sparkles,
    items: [
      {
        href: '/links',
        label: 'My Links',
        description: '配信先と外部リンク集。',
        icon: LinkIcon,
      },
      {
        href: '/puzzles',
        label: 'Solved Puzzles',
        description: '解いた謎解きの記録。',
        icon: Puzzle,
      },
      {
        href: '/recommendations',
        label: FAVORITES_COPY.navLabel,
        description: FAVORITES_COPY.navDescription,
        icon: ListMusic,
      },
      {
        href: '/pointers',
        label: 'Quick access',
        description: 'ブックマークみたいなもの。',
        icon: Pointer,
      },
    ],
  },
] as const

export function NavigationTiles() {
  return (
    <Content size="5xl" className="space-y-12">
      {NAV_GROUPS.map((group) => (
        <section key={group.title} className="space-y-6">
          {/* header */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
                <group.icon className="text-primary h-7 w-7" />
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
            {group.items.map((item) => (
              <Item
                key={item.href}
                variant="card"
                size="sm"
                className="group h-auto w-full"
                asChild
              >
                <Link
                  href={item.href}
                  className="flex w-full items-center gap-3"
                >
                  <ItemMedia
                    variant="icon"
                    className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    <item.icon className="h-4 w-4" />
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
                    <ChevronUp className="h-4 w-4" />
                  </ItemActions>
                </Link>
              </Item>
            ))}
          </ItemGroup>
        </section>
      ))}
    </Content>
  )
}
