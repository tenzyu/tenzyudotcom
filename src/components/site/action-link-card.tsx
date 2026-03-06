import Link from 'next/link'

import { Button } from '@/components/ui/button'

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
    <div>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon className="text-muted-foreground group-hover:text-primary h-6 w-6 transition-colors" />
          )}
          <span className="text-card-foreground group-hover:text-primary font-medium transition-colors">
            {title}
          </span>
        </div>
        <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          &rarr;
        </span>
      </div>
      {description && (
        <span className="text-muted-foreground text-xs leading-relaxed">
          {description}
        </span>
      )}
    </div>
  )

  return internal ? (
    <Button variant="tile" size="tile" asChild>
      <Link href={href}>{content}</Link>
    </Button>
  ) : (
    <Button variant="tile" size="tile" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </Button>
  )
}
