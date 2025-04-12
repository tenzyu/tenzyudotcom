import { CalendarIcon } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/shadcn-ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn-ui/card'
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
    // NOTE: SSGしてるけど dynamic routes なので prefetch = true
    <Link href={`/blog/${slug}`} prefetch>
      <Card
        className={cn(
          'group hover:border-primary transition-colors',
          className,
        )}
      >
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="group-hover:text-primary line-clamp-2 text-2xl transition-colors">
              {title}
            </CardTitle>
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4" />
              <time dateTime={publishedAt.toLocaleDateString('ja-JP')}>
                {new Date(publishedAt).toLocaleDateString('ja-JP')}
              </time>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3">{summary}</CardDescription>
          {tags && tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
