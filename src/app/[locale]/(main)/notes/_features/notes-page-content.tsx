import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/app/[locale]/_features/page-header'
import { hasEditorAdminSession } from '@/app/[locale]/(admin)/editor/_features/editor-session'
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
  const isAdmin = await hasEditorAdminSession()

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
        className="flex flex-col gap-4"
      />

      <div className="space-y-5">
        {isAdmin ? <NoteComposerInline /> : null}

        <div>
          {notes.map((note) => (
            <NoteFeedItem
              key={`${note.createdAt}-${note.body.slice(0, 20)}`}
              locale={locale}
              note={note}
              isAdmin={isAdmin}
              authorName="夢"
              authorHandle="@tenzyu.com"
            />
          ))}
        </div>
      </div>
    </>
  )
}
