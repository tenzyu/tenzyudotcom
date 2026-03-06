import Link from 'next/link'

import { Card } from '@/components/shadcn-ui/card'
import { cn } from '@/lib/utils'

import type { LucideIcon } from 'lucide-react'

type ActionLinkCardProps = {
  title: string
  description?: string
  href: string
  icon?: LucideIcon
  /** true = open in same tab, false = open in new tab */
  internal?: boolean
}

export function ActionLinkCard({
  title,
  description,
  href,
  icon: Icon,
  internal = true,
}: ActionLinkCardProps) {
  const content = (
    <Card className="group hover:bg-accent hover:border-primary/30 flex items-center justify-between px-4 py-3 shadow-sm transition-all sm:px-5 sm:py-4">
      <div className="flex w-full min-w-0 items-center gap-3">
        {Icon && (
          <Icon className="text-muted-foreground group-hover:text-primary h-5 w-5 shrink-0 transition-colors" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="text-card-foreground group-hover:text-primary truncate text-sm font-medium transition-colors">
            {title}
          </span>
          {description && (
            <span className="text-muted-foreground truncate text-xs leading-relaxed">
              {description}
            </span>
          )}
        </div>
      </div>
      <span className="text-muted-foreground ml-4 shrink-0 font-medium opacity-0 transition-opacity group-hover:opacity-100">
        &rarr;
      </span>
    </Card>
  )

  if (internal) {
    return (
      <Link href={href} className={cn('block')}>
        {content}
      </Link>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('block')}
    >
      {content}
    </a>
  )
}
