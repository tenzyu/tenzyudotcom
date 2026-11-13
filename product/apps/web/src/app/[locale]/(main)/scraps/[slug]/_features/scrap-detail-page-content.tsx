import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { PageIntro, ReadingColumn, EditorialList } from '@tenzyu/ui/editorial'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { ScrapMdxRenderer } from '../../_features/scrap-mdx-renderer'
import type { AssembledScrapPage } from '../../_features/scraps.assemble'
import { ScrapEntry } from './scrap-entry'

export function ScrapDetailPageContent({
  locale,
  page,
}: {
  locale: string
  page: AssembledScrapPage
}) {
  const content = useIntlayer('page-scraps')
  return (
    <ReadingColumn className="space-y-10">
      <Link href={getLocalizedUrl('/scraps', locale)}>
        {content.detail.backToList.value}
      </Link>
      <PageIntro
        eyebrow={`Scraps / ${page.manifest.status}`}
        title={page.manifest.title}
        description={page.manifest.summary ?? page.manifest.hypothesis}
      />
      <p>{page.manifest.hypothesis}</p>
      {page.manifest.tags.length > 0 ? (
        <p className="text-sm text-muted-foreground">
          {page.manifest.tags.map((tag) => `#${tag}`).join(' · ')}
        </p>
      ) : null}
      <AdminGate>
        <Link
          href={getLocalizedUrl(
            `/editor/scraps?slug=${page.manifest.slug}`,
            locale,
          )}
        >
          {content.detail.adminTools.value}
        </Link>
      </AdminGate>
      {page.manifest.status === 'closed' ? (
        <p role="note">{content.detail.closedNotice.value}</p>
      ) : null}
      {page.leadState === 'fallback' ? (
        <p className="text-sm text-muted-foreground">
          {content.detail.fallbackLocaleNotice.value}
        </p>
      ) : null}
      {page.leadSource ? (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <ScrapMdxRenderer source={page.leadSource} />
        </article>
      ) : null}
      <section className="space-y-4" aria-labelledby="scrap-entries">
        <h2 id="scrap-entries">
          {content.detail.entriesLabel.value} · {page.entries.length}
        </h2>
        <EditorialList>
          {page.entries.map((entry) => (
            <ScrapEntry key={entry.meta.id} entry={entry} locale={locale} />
          ))}
        </EditorialList>
      </section>
      {page.manifest.outcomes?.length ? (
        <section className="space-y-3">
          <h2>{content.detail.outcomesLabel.value}</h2>
          <ul className="space-y-2">
            {page.manifest.outcomes.map((outcome) => {
              const href =
                outcome.href ??
                (outcome.kind === 'blog' && outcome.slug
                  ? getLocalizedUrl(`/blog/${outcome.slug}`, locale)
                  : undefined)
              const label = outcome.title ?? outcome.slug ?? outcome.href
              if (!label) return null
              return (
                <li
                  key={`${outcome.kind}:${outcome.relation}:${outcome.slug ?? outcome.href}`}
                >
                  {href ? <Link href={href}>{label}</Link> : label}
                  <span className="text-sm text-muted-foreground">
                    {' '}
                    · {outcome.relation}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </ReadingColumn>
  )
}
