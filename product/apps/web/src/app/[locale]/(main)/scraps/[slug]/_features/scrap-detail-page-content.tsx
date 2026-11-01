import { getLocalizedUrl } from 'intlayer'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Badge } from '@tenzyu/ui/badge'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { ScrapMdxRenderer } from '../../_features/scrap-mdx-renderer'
import type { AssembledScrapPage } from '../../_features/scraps.assemble'
import { ScrapEntry } from './scrap-entry'
import { ScrapAppendForm } from './scrap-append-form'
import { ScrapEntryEditor } from './scrap-entry-editor'
import { getAppendEntryFormDefaults } from './scrap-admin-form-defaults'

type ScrapDetailPageContentProps = {
  locale: string
  page: AssembledScrapPage
}

export function ScrapDetailPageContent({
  locale,
  page,
}: ScrapDetailPageContentProps) {
  const content = useIntlayer('page-scraps')
  const requestedLocale = locale === 'ja' || locale === 'en' ? locale : 'ja'
  const formDefaults = getAppendEntryFormDefaults(
    page.manifest.slug,
    requestedLocale,
    locale,
  )

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href={getLocalizedUrl('/scraps', locale)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          {content.detail.backToList.value}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="title text-3xl font-semibold tracking-tighter sm:text-4xl">
            {page.manifest.title}
          </h1>
          <Badge
            variant={
              page.manifest.status === 'open'
                ? 'default'
                : page.manifest.status === 'closed'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {page.manifest.status === 'open'
              ? content.status.open.value
              : page.manifest.status === 'closed'
                ? content.status.closed.value
                : content.status.archived.value}
          </Badge>
        </div>
        <p className="text-sm">
          <span className="text-foreground/80 font-semibold">
            {content.detail.hypothesisLabel.value}:
          </span>{' '}
          <span className="text-muted-foreground">
            {page.manifest.hypothesis}
          </span>
        </p>
        {page.manifest.summary ? (
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground/80 font-semibold">
              {content.detail.summaryLabel.value}:
            </span>{' '}
            {page.manifest.summary}
          </p>
        ) : null}
        {page.manifest.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2 text-xs">
            {page.manifest.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="outline" className="font-medium">
                  #{tag}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {page.manifest.status === 'closed' ? (
        <div className="border-border/60 bg-muted/40 rounded-2xl border px-4 py-3 text-sm">
          {content.detail.closedNotice.value}
        </div>
      ) : null}

      {page.leadState === 'fallback' ? (
        <div className="border-border/60 bg-card/50 rounded-2xl border px-4 py-3 text-xs text-muted-foreground">
          {content.detail.fallbackLocaleNotice.value}
        </div>
      ) : null}

      {page.leadSource ? (
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <ScrapMdxRenderer source={page.leadSource} />
        </article>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {content.detail.entriesLabel.value}
          </h2>
          <p className="text-muted-foreground text-xs">
            {page.entries.length}
          </p>
        </div>

        <AdminGate>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {content.detail.adminTools.value}
            </p>
            <ScrapAppendForm
              defaults={formDefaults}
              labels={{
                title: content.detail.appendEntry.value,
                kind: content.detail.kindLabel.value,
                locale: content.detail.localeLabel.value,
                body: content.detail.entriesLabel.value,
                save: content.detail.saveLabel.value,
                cancel: content.detail.cancelLabel.value,
                open: content.detail.appendEntry.value,
                close: content.detail.cancelLabel.value,
                placeholder: content.detail.placeholder.value,
              }}
            />
          </div>
        </AdminGate>

        <div className="space-y-3">
          {page.entries.map((entry) => (
            <div key={entry.meta.id} className="space-y-2">
              <ScrapEntry entry={entry} locale={locale} />
              <AdminGate>
                <ScrapEntryEditor
                  scrapSlug={page.manifest.slug}
                  entryId={entry.meta.id}
                  locale={requestedLocale}
                  uiLocale={locale}
                  initialBody={entry.localizedSource ?? ''}
                  labels={{
                    title: content.detail.editEntry.value,
                    body: content.detail.entriesLabel.value,
                    save: content.detail.saveLabel.value,
                    cancel: content.detail.cancelLabel.value,
                    open: content.detail.editEntry.value,
                    close: content.detail.cancelLabel.value,
                    placeholder: content.detail.placeholder.value,
                  }}
                />
              </AdminGate>
            </div>
          ))}
        </div>
      </section>

      {page.manifest.outcomes && page.manifest.outcomes.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {content.detail.outcomesLabel.value}
          </h2>
          <ul className="space-y-2 text-sm">
            {page.manifest.outcomes.map((outcome) => {
              const href = outcome.href
                ? outcome.href
                : outcome.kind === 'blog' && outcome.slug
                  ? getLocalizedUrl(`/blog/${outcome.slug}`, locale)
                  : undefined
              const label = outcome.title ?? outcome.slug ?? outcome.href

              if (!label) {
                return null
              }

              const key = `${outcome.kind}:${outcome.relation}:${outcome.slug ?? outcome.href ?? label}`

              return (
                <li key={key}>
                  {href ? (
                    <Link
                      href={href}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span>{label}</span>
                  )}
                  <span className="text-muted-foreground text-xs">
                    {' '}· {outcome.kind} / {outcome.relation}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
