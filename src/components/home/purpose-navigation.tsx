import { Code, Disc, User } from 'lucide-react'
import Link from 'next/link'

import { Card } from '@/components/shadcn-ui/card'

const PURPOSES = [
  {
    href: '/portfolio',
    title: 'About',
    description: 'Who is tenzyu',
    icon: User,
  },
  {
    href: '/archives/osu-profile',
    title: 'osu!',
    description: 'Play, clips, guides',
    icon: Disc,
  },
  {
    href: '/tools',
    title: 'Build',
    description: 'Tools, projects, portfolio',
    icon: Code,
  },
] as const

export function PurposeNavigation() {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {PURPOSES.map((item) => (
        <Link key={item.href} href={item.href} className="group outline-none">
          <Card className="border-border/40 bg-card/40 hover:border-primary/40 hover:bg-primary/5 flex h-full flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.04)]">
            <div className="bg-primary/10 group-hover:bg-primary flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-500">
              <item.icon className="text-primary group-hover:text-primary-foreground h-8 w-8 transition-colors duration-500" />
            </div>
            <div className="space-y-1">
              <h3 className="group-hover:text-primary text-xl font-bold tracking-wide transition-colors duration-500">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm font-medium">
                {item.description}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </section>
  )
}
