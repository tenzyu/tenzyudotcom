import { CalendarIcon } from 'lucide-react'
import Link from 'next/link'

import { formatDate } from '@/lib/blog'
import { cn } from '@/lib/utils'

type BlogCardProps = {
  title: string
  summary: string
  publishedAt: Date
  slug: string
  tags?: string[]
  className?: string
}

export function BlogCard({
  title,
  summary,
  publishedAt,
  slug,
  tags,
  className,
}: BlogCardProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      prefetch
      className={cn(
        'group border-border/40 hover:border-primary/50 hover:bg-muted/30 focus-visible:ring-primary flex flex-col gap-3 rounded-2xl border p-5 transition-all focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
        <h2 className="group-hover:text-primary line-clamp-2 text-xl font-bold tracking-tight transition-colors">
          {title}
        </h2>
        <time
          className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-sm font-medium"
          dateTime={new Date(publishedAt).toISOString()}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {formatDate(publishedAt)}
        </time>
      </div>
      <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
        {summary}
      </p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground group-hover:text-primary/80 rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
