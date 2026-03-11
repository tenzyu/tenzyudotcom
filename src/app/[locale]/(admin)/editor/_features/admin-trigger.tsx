import { getLocalizedUrl } from 'intlayer'
import { Pencil } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { EditorCollectionId } from '@/lib/editor/editor.port'
import { hasEditorAdminSession } from './session'

type EditorAdminTriggerProps = {
  locale: string
  collectionId?: EditorCollectionId
  slug?: string
}

export async function EditorAdminTrigger({
  locale,
  collectionId,
  slug,
}: EditorAdminTriggerProps) {
  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) return null

  // Link to specific editor or dashboard
  const href = collectionId
    ? getLocalizedUrl(
        `/editor/${collectionId}${slug ? `?slug=${slug}` : ''}`,
        locale,
      )
    : getLocalizedUrl('/editor', locale)

  return (
    <div className="fixed right-6 bottom-24 z-50 flex flex-col items-center gap-2">
      <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
        Admin
      </span>
      <Button
        asChild
        size="icon"
        variant="outline"
        className="size-12 rounded-full shadow-lg ring-1 ring-border transition-all hover:scale-105"
        title={collectionId ? `Edit ${collectionId}` : 'Editor Dashboard'}
      >
        <Link href={href}>
          <Pencil className="size-5" />
          <span className="sr-only">
            {collectionId ? `Edit ${collectionId}` : 'Open Editor'}
          </span>
        </Link>
      </Button>
    </div>
  )
}
