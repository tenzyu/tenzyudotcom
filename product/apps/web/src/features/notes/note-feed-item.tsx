import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@tenzyu/ui/avatar'
import { cn } from '@tenzyu/ui'
import { FooterShareDialog } from '@/components/site/footer-share-dialog'
import { NoteRelativeTime } from './note-relative-time-view'
import { NoteControls } from './note-controls'
import type { NotePageItem } from './notes.assemble'

export function NoteFeedItem({
  locale,
  note,
  focused = false,
}: {
  locale: string
  note: NotePageItem
  focused?: boolean
}) {
  const ja = locale === 'ja'
  return (
    <article
      className={cn(
        'min-w-0 border-b border-border/60 py-5',
        note.depth === 1 && 'ml-2 sm:ml-5',
        note.depth > 1 && 'ml-4 sm:ml-10',
        focused && 'rounded-md border bg-muted/35 px-3',
      )}
    >
      <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-4">
        <Avatar className="size-9 border border-border/60 sm:size-11">
          <AvatarImage src="/images/ltvgbz.jpg" alt="" />
          <AvatarFallback>TN</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
            <span className="font-semibold">tenzyu</span>
            <span className="text-muted-foreground">@tenzyu.com</span>
            <Link
              href={note.sharePath}
              aria-current={focused ? 'page' : undefined}
              aria-label={ja ? 'ノートの固定リンク' : 'Note permalink'}
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              <NoteRelativeTime createdAt={note.createdAt} locale={locale} />
            </Link>
          </div>
          {note.parent && (
            <Link
              href={note.parent.href}
              className="mt-1 block max-w-full truncate text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              {ja
                ? `返信先 ${note.parent.excerpt}`
                : `Reply to ${note.parent.excerpt}`}
            </Link>
          )}
          <p
            className={cn(
              'mt-1 whitespace-pre-wrap wrap-anywhere text-base leading-8',
              focused && 'text-xl leading-9 sm:text-2xl',
            )}
          >
            {note.body}
          </p>
          {note.externalUrl && (
            <a
              href={note.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block break-all text-sm text-primary underline underline-offset-4"
            >
              {note.externalUrl}
            </a>
          )}
          <div className="mt-2 flex items-center gap-1 text-muted-foreground">
            <FooterShareDialog
              title={note.body.slice(0, 72)}
              itemPath={note.sharePath}
              triggerClassName="size-9 p-0"
            />
            <NoteControls locale={locale} id={note.id} focused={focused} />
          </div>
        </div>
      </div>
    </article>
  )
}
