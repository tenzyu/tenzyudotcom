import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getLocalizedUrl } from 'intlayer'
import { NoteFeedItem } from '../../_features/note-feed-item'

type NoteDetailPageContentProps = {
  locale: string
  note: {
    id: string
    body: string
    createdAt: string
    depth: number
    externalUrl?: string
    parentId?: string
    hasConnectorAbove: boolean
    hasConnectorBelow: boolean
    sharePath: string
    showBottomBorder: boolean
  }
  ancestors: NoteDetailPageContentProps['note'][]
  replies: NoteDetailPageContentProps['note'][]
}

function getUiText(locale: string) {
  if (locale === 'ja') {
    return {
      back: 'ノート一覧へ戻る',
      title: 'Post',
    }
  }

  return {
    back: 'Back to notes',
    title: 'Post',
  }
}

export function NoteDetailPageContent({
  locale,
  note,
  ancestors,
  replies,
}: NoteDetailPageContentProps) {
  const text = getUiText(locale)

  return (
    <div className="overflow-hidden rounded-3xl border border-border/60">
      <div className="bg-card/80 border-b border-border/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={getLocalizedUrl('/notes', locale)}
            aria-label={text.back}
            className="text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <p className="text-base font-semibold">{text.title}</p>
          </div>
        </div>
      </div>

      <div className="bg-card">
        {ancestors.map((entry) => (
          <NoteFeedItem
            key={entry.id}
            locale={locale}
            note={entry}
            authorName="夢"
            authorHandle="@tenzyu.com"
            variant="detail-thread"
          />
        ))}

        <NoteFeedItem
          locale={locale}
          note={note}
          authorName="夢"
          authorHandle="@tenzyu.com"
          variant="detail-focus"
        />

        {replies.map((entry) => (
          <NoteFeedItem
            key={entry.id}
            locale={locale}
            note={entry}
            authorName="夢"
            authorHandle="@tenzyu.com"
            variant="detail-thread"
          />
        ))}
      </div>
    </div>
  )
}
