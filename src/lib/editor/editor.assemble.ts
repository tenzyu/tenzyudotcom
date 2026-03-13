import { isEditorBlobStorage } from '@/config/env.infra'
import type { EditorCollectionId } from './editor.domain'
import type { EditorRepository } from './editor.port'
import { BlobEditorRepository } from './editor-blob.infra'
import { LocalEditorRepository } from './editor-local.infra'

let editorRepository: EditorRepository | undefined

export function makeEditorRepository(): EditorRepository {
  if (editorRepository) {
    return editorRepository
  }

  editorRepository = isEditorBlobStorage
    ? new BlobEditorRepository()
    : new LocalEditorRepository()

  return editorRepository
}

export function matchCollectionIdByPath(
  pathname: string,
): EditorCollectionId | null {
  const normalizedPath = pathname.replace(/^\/(ja|en)(\/|$)/, '/')
  if (normalizedPath === '/blog' || normalizedPath.startsWith('/blog/'))
    return 'blog'
  if (
    normalizedPath === '/recommendations' ||
    normalizedPath.startsWith('/recommendations/')
  )
    return 'recommendations'
  if (normalizedPath === '/notes' || normalizedPath.startsWith('/notes/'))
    return 'notes'
  if (normalizedPath === '/puzzles' || normalizedPath.startsWith('/puzzles/'))
    return 'puzzles'
  if (normalizedPath === '/pointers' || normalizedPath.startsWith('/pointers/'))
    return 'pointers'
  if (normalizedPath === '/links' || normalizedPath.startsWith('/links/'))
    return 'links'
  return null
}
