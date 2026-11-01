import { useIntlayer } from 'next-intlayer/server'
import { Badge } from '@tenzyu/ui/badge'
import { EditorialEntry } from '@tenzyu/ui/editorial'
import { ScrapMdxRenderer } from '../../_features/scrap-mdx-renderer'
import type { AssembledScrapEntry } from '../../_features/scraps.assemble'
import { formatDate } from '../../../_features/format-date'

type ScrapEntryProps = {
  entry: AssembledScrapEntry
  locale: string
  className?: string
}

export function ScrapEntry({ entry, locale, className }: ScrapEntryProps) {
  const content = useIntlayer('page-scraps')
  const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US'
  const created = new Date(entry.meta.createdAt)

  return (
    <EditorialEntry className={className}>
      <article
        id={`entry-${entry.meta.id}`}
        data-scrap-entry-id={entry.meta.id}
        data-scrap-entry-kind={entry.meta.kind}
        className="space-y-4"
      >
        <header className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="uppercase tracking-wide text-xs"
            >
              {entry.meta.kind}
            </Badge>
            {entry.localizedState === 'fallback' ? (
              <Badge variant="secondary" className="text-xs">
                {content.detail.fallbackLocaleNotice.value}
              </Badge>
            ) : null}
            {entry.renderedLocale &&
            entry.meta.documents.find(
              (ref) => ref.locale === entry.renderedLocale,
            )?.state === 'machine-draft' ? (
              <Badge
                variant="outline"
                className="text-xs text-amber-700 dark:text-amber-200"
              >
                {content.list.machineDraftBadge.value}
              </Badge>
            ) : null}
          </div>
          <time
            className="text-muted-foreground text-xs"
            dateTime={created.toISOString()}
          >
            {formatDate(created, dateLocale)}
          </time>
        </header>
        {entry.localizedSource ? (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-sm leading-7 prose-pre:overflow-x-auto">
            <ScrapMdxRenderer source={entry.localizedSource} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {content.detail.missingDocumentNotice.value}
          </p>
        )}
      </article>
    </EditorialEntry>
  )
}
