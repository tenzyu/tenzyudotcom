import {
  Disc,
  FileText,
  FolderArchive,
  Hammer,
  Pointer,
  Puzzle,
  Sparkles,
  User,
  ListMusic,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const NAV_GROUPS = [
  {
    title: 'Outputs',
    subtitle: 'What I do',
    icon: User,
    items: [
      { href: '/tools', label: 'Tools', icon: Hammer },
      { href: '/blog', label: 'Blog', icon: FileText },
      { href: '/portfolio', label: 'Portfolio', icon: Disc },
      { href: '/archives', label: 'Archives', icon: FolderArchive },
    ],
  },
  {
    title: 'Externals',
    subtitle: 'Jump to external resources',
    icon: Sparkles,
    items: [
      { href: '/links', label: 'My Links', icon: LinkIcon },
      { href: '/puzzles', label: 'Favorite Puzzles', icon: Puzzle },
      { href: '/recommendations', label: 'Recommendations', icon: ListMusic },
      { href: '/pointers', label: 'Quick access', icon: Pointer },
    ],
  },
] as const

export function NavigationTiles() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-12">
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {group.items.map((item) => (
              <Button
                key={item.href}
                variant="feature-card"
                className="group h-auto w-full"
                asChild
              >
                <Link href={item.href} className="flex flex-col items-center">
                  <div className="bg-primary/10 group-hover:bg-primary flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-500">
                    <item.icon className="text-primary group-hover:text-primary-foreground h-6 w-6 transition-colors duration-500" />
                  </div>
                  <span className="group-hover:text-primary text-sm font-bold tracking-wide transition-colors duration-500">
                    {item.label}
                  </span>
                </Link>
              </Button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
