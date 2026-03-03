import {
  Disc,
  FileText,
  FolderArchive,
  Hammer,
  Pointer,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/shadcn-ui/button'

export function NavigationGrid() {
  return (
    <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        { href: '/links', label: 'Links', icon: LinkIcon },
        { href: '/blog', label: 'Blog', icon: FileText },
        { href: '/tools', label: 'Tools', icon: Hammer },
        { href: '/pointers', label: 'Pointers', icon: Pointer },
        { href: '/portfolio', label: 'Portfolio', icon: Disc },
        { href: '/archives', label: 'Archives', icon: FolderArchive },
      ].map((item) => (
        <Button
          key={item.href}
          variant="outline"
          className="group hover:bg-primary hover:text-primary-foreground h-auto flex-col gap-3 rounded-2xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
          asChild
        >
          <Link href={item.href}>
            <item.icon className="h-6 w-6 opacity-70 transition-transform group-hover:scale-110 group-hover:opacity-100" />
            <span className="text-sm font-bold tracking-wide">
              {item.label}
            </span>
          </Link>
        </Button>
      ))}
    </section>
  )
}
