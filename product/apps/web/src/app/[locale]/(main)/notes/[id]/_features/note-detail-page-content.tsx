import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getLocalizedUrl } from 'intlayer'
import { ReadingColumn } from '@tenzyu/ui/editorial'
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
      title: 'ノート',
    }
  }

  return {
    back: 'Back to notes',
    title: 'Note',
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
    <ReadingColumn>
      <div className="border-b border-border py-4">
        <div className="flex items-center gap-3">
          <Link
            href={getLocalizedUrl('/notes', locale)}
            aria-label={text.back}
            className="text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl">{text.title}</h1>
          </div>
        </div>
      </div>

      <div>
        {ancestors.map((entry) => (
          <NoteFeedItem
            key={entry.id}
            locale={locale}
            note={entry}
            authorName="tenzyu"
            authorHandle="@tenzyu.com"
            variant="detail-thread"
          />
        ))}

        <NoteFeedItem
          locale={locale}
          note={note}
          authorName="tenzyu"
          authorHandle="@tenzyu.com"
          variant="detail-focus"
        />

        {replies.map((entry) => (
          <NoteFeedItem
            key={entry.id}
            locale={locale}
            note={entry}
            authorName="tenzyu"
            authorHandle="@tenzyu.com"
            variant="detail-thread"
          />
        ))}
      </div>
    </ReadingColumn>
  )
}
