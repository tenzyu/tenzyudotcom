import { getLocalizedUrl } from 'intlayer'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from 'next-intlayer/server'
import { ExternalLink } from '@/components/site-ui/external-link'
import { Card } from '@/components/ui/card'

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
  const { locale } = useLocale()
  const content = (
    <>
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
    </>
  )

  return (
    <Card
      variant="interactive"
      className="group w-full gap-3 px-5 py-4"
      asChild
    >
      {internal ? (
        <Link
          href={href.startsWith('/') ? getLocalizedUrl(href, locale) : href}
        >
          {content}
        </Link>
      ) : (
        <ExternalLink href={href}>{content}</ExternalLink>
      )}
    </Card>
  )
}
