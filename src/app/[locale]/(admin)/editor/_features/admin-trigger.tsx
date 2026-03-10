import { getLocalizedUrl } from 'intlayer'
import { Pencil } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { matchCollectionIdByPath } from '@/lib/editor/editor.contract'
import { hasEditorAdminSession } from './session'

export async function EditorAdminTrigger({ locale }: { locale: string }) {
  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) return null

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  const collectionId = matchCollectionIdByPath(pathname)

  if (!collectionId) return null

  const isBlog = collectionId === 'blog'
  const slug = isBlog ? pathname.split('/').pop() : undefined
  const href = getLocalizedUrl(
    `/editor/${collectionId}${slug ? `?slug=${slug}` : ''}`,
    locale,
  )

  return (
    <div className="fixed right-6 bottom-24 z-50">
      <Button
        asChild
        size="icon"
        variant="outline"
        className="size-12 rounded-full shadow-lg ring-1 ring-border transition-all hover:scale-105"
        title={`Edit ${collectionId}`}
      >
        <Link href={href}>
          <Pencil className="size-5" />
          <span className="sr-only">Edit this page</span>
        </Link>
      </Button>
    </div>
  )
}
