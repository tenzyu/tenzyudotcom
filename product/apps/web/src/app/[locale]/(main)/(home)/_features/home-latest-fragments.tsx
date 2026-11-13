import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { SectionHeader } from '@/components/site/section-header'
import { EditorialEntry, EditorialList } from '@tenzyu/ui/editorial'

type HomeLatestFragmentsProps = {
  locale: string
  latestNotes: {
    body: string
    createdAt: string
  }[]
  latestPost?: {
    slug: string
    metadata: {
      title: string
      summary: string
      publishedAt: Date
    }
  }
}

const noteDateFormatter = (locale: string) =>
  new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export function HomeLatestFragments({
  locale,
  latestNotes,
  latestPost,
}: HomeLatestFragmentsProps) {
  const home = useIntlayer('page-home', locale)
  const formatter = noteDateFormatter(locale)

  return (
    <section className="space-y-6">
      <SectionHeader
        title={home.fragmentsTitle.value}
        description={home.fragmentsSubtitle.value}
      />

      <EditorialList>
        {latestPost ? (
          <EditorialEntry>
            <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
              {home.fragmentsBlogTitle}
            </p>
            <Link
              href={getLocalizedUrl(`/blog/${latestPost.slug}`, locale)}
              className="group block"
            >
              <h3 className="font-serif text-2xl leading-snug group-hover:text-primary group-hover:underline">
                {latestPost.metadata.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {latestPost.metadata.summary}
              </p>
            </Link>
          </EditorialEntry>
        ) : null}
        {latestNotes.map((note) => (
          <EditorialEntry key={note.createdAt}>
            <time
              dateTime={note.createdAt}
              className="text-xs text-muted-foreground"
            >
              {formatter.format(new Date(note.createdAt))}
            </time>
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-base leading-8">
              {note.body}
            </p>
          </EditorialEntry>
        ))}
      </EditorialList>
      {!latestPost && latestNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">{home.fragmentsEmpty}</p>
      ) : null}
      <Link
        href={getLocalizedUrl('/notes', locale)}
        className="inline-flex min-h-11 items-center text-sm underline hover:text-primary"
      >
        {home.fragmentsNotesLinkLabel}
      </Link>
    </section>
  )
}
