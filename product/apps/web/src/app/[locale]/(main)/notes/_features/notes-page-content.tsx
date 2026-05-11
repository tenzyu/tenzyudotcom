import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@tenzyu/ui/page-header'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { NoteComposerInline } from './note-composer-inline'
import { NoteFeedItem } from './note-feed-item'

type NotesPageContentProps = {
  locale: string
  notes: {
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
  }[]
}

export async function NotesPageContent({
  locale,
  notes,
}: NotesPageContentProps) {
  const content = useIntlayer('page-notes')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
        className="flex flex-col gap-4"
      />

      <div className="space-y-5">
        <AdminGate>
          <NoteComposerInline />
        </AdminGate>

        <div className="overflow-hidden rounded-3xl border border-border/60">
          {notes.map((note) => (
            <NoteFeedItem
              key={note.id}
              locale={locale}
              note={note}
              authorName="夢"
              authorHandle="@tenzyu.com"
            />
          ))}
        </div>
      </div>
    </>
  )
}
