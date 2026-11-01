import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { EditorialEntry } from '@tenzyu/ui/editorial'
import { formatDate } from '../../_features/format-date'
import type { ScrapIndexEntry } from './scraps.domain'

export function ScrapCard({
  scrap,
  locale,
  className,
}: {
  scrap: ScrapIndexEntry
  locale: string
  className?: string
}) {
  const content = useIntlayer('page-scraps')
  const status = content.status[scrap.status].value
  const language = locale === 'en' ? 'en' : 'ja'
  return (
    <EditorialEntry className={className}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{status}</span>
        <span>
          {scrap.entryCount} {content.card.entryCountSuffix.value}
        </span>
        <time dateTime={scrap.updatedAt}>
          {formatDate(
            new Date(scrap.updatedAt),
            language === 'ja' ? 'ja-JP' : 'en-US',
          )}
        </time>
      </div>
      <h2>
        <Link href={getLocalizedUrl(`/scraps/${scrap.slug}`, locale)}>
          {scrap.title}
        </Link>
      </h2>
      <p>{scrap.summary ?? scrap.hypothesis}</p>
      {scrap.tags.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {scrap.tags.map((tag) => `#${tag}`).join(' · ')}
        </p>
      ) : null}
      {!scrap.indexableLocales.includes(language) ? (
        <p className="text-sm text-muted-foreground">
          {content.list.fallbackLocaleBadge.value}
        </p>
      ) : null}
    </EditorialEntry>
  )
}
