import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getLocalizedUrl } from 'intlayer'
import { ReadingColumn } from '@tenzyu/ui/editorial'
import { NoteFeedItem } from '../../_features/note-feed-item'
import type { NoteDetailPageData } from '../../_features/notes.assemble'

export function NoteDetailPageContent({
  locale,
  note,
  ancestors,
  replies,
}: NoteDetailPageData & { locale: string }) {
  const ja = locale === 'ja'
  return (
    <ReadingColumn>
      <div className="flex items-center gap-3 border-b border-border py-4">
        <Link
          href={getLocalizedUrl('/notes', locale)}
          aria-label={ja ? 'ノート一覧へ戻る' : 'Back to notes'}
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <h1 className="font-serif text-2xl">{ja ? 'ノート' : 'Note'}</h1>
      </div>
      {ancestors.length > 0 && (
        <section aria-label={ja ? '返信元のノート' : 'Earlier in this thread'}>
          {ancestors.map((entry) => (
            <NoteFeedItem key={entry.id} locale={locale} note={entry} />
          ))}
        </section>
      )}
      <NoteFeedItem locale={locale} note={note} focused />
      {replies.length > 0 && (
        <section aria-labelledby="note-replies">
          <h2 id="note-replies" className="mt-5 font-serif text-lg">
            {ja ? '返信' : 'Replies'}
          </h2>
          {replies.map((entry) => (
            <NoteFeedItem key={entry.id} locale={locale} note={entry} />
          ))}
        </section>
      )}
    </ReadingColumn>
  )
}
