import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'
import Link from 'next/link'

interface BlogCardProps {
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
    <Link href={`/blog/${slug}`}>
      <Card
        className={cn(
          'group transition-colors hover:border-primary',
          className,
        )}
      >
        <CardHeader>
          <div className='space-y-1'>
            <CardTitle className='line-clamp-2 text-2xl transition-colors group-hover:text-primary'>
              {title}
            </CardTitle>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <CalendarIcon className='h-4 w-4' />
              <time dateTime={publishedAt.toLocaleDateString('ja-JP')}>
                {new Date(publishedAt).toLocaleDateString('ja-JP')}
              </time>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className='line-clamp-3'>{summary}</CardDescription>
          {tags && tags.length > 0 && (
            <div className='mt-4 flex flex-wrap gap-2'>
              {tags.map(tag => (
                <Badge key={tag} variant='secondary'>
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
