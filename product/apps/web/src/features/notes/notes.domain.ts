import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'

export function buildLocalizedNotePath(locale: string, noteId: string) {
  return buildLocalizedUrl(`/notes/${noteId}`, locale)
}

export * from '@tenzyu/publishing-domain/notes'
