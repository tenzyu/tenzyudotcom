import {
  Disc,
  FileText,
  FolderArchive,
  Hammer,
  Pointer,
  Puzzle,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/shadcn-ui/button'

const NAV_ITEMS = [
  { href: '/links', label: 'Links', icon: LinkIcon },
  { href: '/blog', label: 'Blog', icon: FileText },
  { href: '/tools', label: 'Tools', icon: Hammer },
  { href: '/puzzles', label: 'Puzzles', icon: Puzzle },
  { href: '/pointers', label: 'Pointers', icon: Pointer },
  { href: '/portfolio', label: 'Portfolio', icon: Disc },
  { href: '/archives', label: 'Archives', icon: FolderArchive },
] as const

export function NavigationGrid() {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {NAV_ITEMS.map((item) => (
        <Button
          key={item.href}
          variant="outline"
          className="group border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5 h-auto flex-col gap-4 rounded-3xl border p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.04)]"
          asChild
        >
          <Link href={item.href}>
            <div className="bg-primary/10 group-hover:bg-primary flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-500">
              <item.icon className="text-primary group-hover:text-primary-foreground h-6 w-6 transition-colors duration-500" />
            </div>
            <span className="group-hover:text-primary text-sm font-bold tracking-wide transition-colors duration-500">
              {item.label}
            </span>
          </Link>
        </Button>
      ))}
    </section>
  )
}
