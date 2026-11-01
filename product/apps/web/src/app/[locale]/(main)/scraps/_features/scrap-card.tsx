import { getLocalizedUrl } from 'intlayer'
import { CalendarIcon, Layers } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Badge } from '@tenzyu/ui/badge'
import { Card } from '@tenzyu/ui/card'
import { cn } from '@tenzyu/ui'
import { formatDate } from '../../_features/format-date'
import type { ScrapIndexEntry, ScrapStatus } from './scraps.domain'

type ScrapCardProps = {
  scrap: ScrapIndexEntry
  locale: string
  className?: string
}

const STATUS_VARIANT: Record<ScrapStatus, 'default' | 'secondary' | 'outline'> = {
  open: 'default',
  closed: 'secondary',
  archived: 'outline',
}

export function ScrapCard({ scrap, locale, className }: ScrapCardProps) {
  const content = useIntlayer('page-scraps')
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const href = getLocalizedUrl(`/scraps/${scrap.slug}`, locale)
  const status =
    scrap.status === 'open'
      ? content.status.open.value
      : scrap.status === 'closed'
        ? content.status.closed.value
        : content.status.archived.value
  const requestedLocale = locale === 'ja' || locale === 'en' ? locale : 'ja'
  const hasRequestedIndexable = scrap.indexableLocales.includes(
    requestedLocale,
  )
  const requestedLeadState = scrap.lead.find(
    (lead) => lead.locale === requestedLocale,
  )?.state

  return (
    <Card
      className={cn(
        'group focus-visible:ring-ring/50 gap-3 p-5 focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      <Link href={href} prefetch>
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <h2 className="group-hover:text-primary line-clamp-2 text-xl font-bold tracking-tight transition-colors">
            {scrap.title}
          </h2>
          <div className="text-muted-foreground flex shrink-0 flex-wrap items-center gap-2 text-sm font-medium">
            <Badge variant={STATUS_VARIANT[scrap.status]}>{status}</Badge>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {scrap.entryCount} {content.card.entryCountSuffix.value}
            </span>
            <time
              className="inline-flex items-center gap-1.5"
              dateTime={new Date(scrap.updatedAt).toISOString()}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {content.card.updatedPrefix.value}{' '}
              {formatDate(new Date(scrap.updatedAt), dateLocale)}
            </time>
          </div>
        </div>
        <div className="text-muted-foreground space-y-1 text-sm leading-relaxed">
          <p>
            <span className="text-foreground/80 font-semibold">
              {content.card.hypothesisLabel.value}:
            </span>{' '}
            <span className="line-clamp-2">{scrap.hypothesis}</span>
          </p>
          {scrap.summary ? (
            <p className="line-clamp-3">{scrap.summary}</p>
          ) : null}
          {scrap.hasOutcomes ? (
            <p className="text-xs font-medium text-primary">
              {content.card.outcomesLabel.value}
            </p>
          ) : null}
        </div>
        {scrap.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {scrap.tags.map((tag) => (
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
        {requestedLeadState === 'machine-draft' ? (
          <p className="text-amber-700 text-xs dark:text-amber-200">
            {content.list.machineDraftBadge.value}
          </p>
        ) : !hasRequestedIndexable ? (
          <p className="text-muted-foreground text-xs">
            {content.list.fallbackLocaleBadge.value}
          </p>
        ) : null}
      </Link>
    </Card>
  )
}
