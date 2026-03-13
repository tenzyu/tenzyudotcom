import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/app/[locale]/_features/page-header'
import { AdminGate } from '@/app/[locale]/(main)/_features/admin/admin-gate'
import { NoteComposerInline } from './note-composer-inline'
import { NoteFeedItem } from './note-feed-item'

type NotesPageContentProps = {
  locale: string
  notes: {
    body: string
    createdAt: string
    externalUrl?: string
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

        <div>
          {notes.map((note) => (
            <NoteFeedItem
              key={`${note.createdAt}-${note.body.slice(0, 20)}`}
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
