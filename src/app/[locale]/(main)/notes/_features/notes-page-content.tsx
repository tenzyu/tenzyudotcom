import { useIntlayer } from 'next-intlayer/server'
import { PageHeader } from '@/components/site-ui/page-header'
import { ExternalLink } from '@/components/site-ui/external-link'
import { Card, CardContent } from '@/components/ui/card'

type NotesPageContentProps = {
  notes: {
    body: string
    createdAt: string
    externalUrl?: string
  }[]
}

export function NotesPageContent({ notes }: NotesPageContentProps) {
  const content = useIntlayer('page-notes')

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.lead.value}
        className="flex flex-col gap-4"
      />
      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={`${note.createdAt}-${note.body.slice(0, 20)}`}>
            <CardContent className="space-y-3 pt-6">
              <time className="text-muted-foreground text-xs" dateTime={note.createdAt}>
                {new Intl.DateTimeFormat('ja-JP', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(note.createdAt))}
              </time>
              <p className="leading-relaxed whitespace-pre-wrap">{note.body}</p>
              {note.externalUrl ? (
                <ExternalLink href={note.externalUrl}>
                  {content.openExternal.value}
                </ExternalLink>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
