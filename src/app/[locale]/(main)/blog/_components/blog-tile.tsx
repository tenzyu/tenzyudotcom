import { CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { getLocalizedUrl } from 'intlayer'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/blog/utils'
import { cn } from '@/lib/utils'

type BlogTileProps = {
  title: string
  summary: string
  publishedAt: Date
  slug: string
  tags?: string[]
  className?: string
  locale?: string
}

export function BlogTile({
  title,
  summary,
  publishedAt,
  slug,
  tags,
  className,
  locale = 'en-US',
}: BlogTileProps) {
  const href = getLocalizedUrl(`/blog/${slug}`, locale)

  return (
    <Card
      asChild
      variant="interactive"
      className={cn(
        'group focus-visible:ring-ring/50 gap-3 p-5 focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <Link href={href} prefetch>
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <h2 className="group-hover:text-primary line-clamp-2 text-xl font-bold tracking-tight transition-colors">
            {title}
          </h2>
          <time
            className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-sm font-medium"
            dateTime={new Date(publishedAt).toISOString()}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDate(publishedAt, locale)}
          </time>
        </div>
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {summary}
        </p>
        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="group-hover:text-primary/80 transition-colors"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </Link>
    </Card>
  )
}
