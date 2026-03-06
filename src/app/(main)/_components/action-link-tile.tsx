import Link from 'next/link'

import { Card } from '@/components/ui/card'

import type { LucideIcon } from 'lucide-react'

type ActionLinkTileProps = {
  title: string
  description?: string
  href: string
  icon?: LucideIcon
  /** true = open in same tab, false = open in new tab */
  internal?: boolean
}

export function ActionLinkTile({
  title,
  description,
  href,
  icon: Icon,
  internal = true,
}: ActionLinkTileProps) {
  const Comp = internal ? Link : 'a'
  const linkProps = internal
    ? { href }
    : { href, target: '_blank', rel: 'noopener noreferrer' }

  return (
    <Card
      variant="interactive"
      className="group w-full gap-3 px-5 py-4"
      asChild
    >
      <Comp {...linkProps}>
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
        {description ? (
          <span className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </span>
        ) : null}
      </Comp>
    </Card>
  )
}
