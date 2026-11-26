import { parseJsonCollection } from '@tenzyu/revisioned-content/json-document'
import { saveJsonCollection } from '@/platform/content-store/json-document.infra'
import { loadGitHubTextFileFresh } from '@/platform/content-store/github-content.infra'
import type { ContentSnapshot } from '@tenzyu/revisioned-content/contracts'
import { parseNoteSourceEntries, type NoteSourceEntry } from '@tenzyu/publishing-domain/notes'

export const NOTES_STORAGE_PATH = 'editor/notes.json'

export async function loadNotesState() {
  const file = await loadGitHubTextFileFresh(NOTES_STORAGE_PATH)
  return parseJsonCollection(
    file?.content,
    parseNoteSourceEntries,
    () => [] as readonly NoteSourceEntry[],
  )
}

export async function saveNotesState(
  rawJson: string,
  expectedVersion?: string,
) {
  return saveJsonCollection(
    NOTES_STORAGE_PATH,
    rawJson,
    parseNoteSourceEntries,
    expectedVersion,
  )
}

export async function loadPublicNoteEntries(snapshot: ContentSnapshot) {
  const file = await snapshot.loadText(NOTES_STORAGE_PATH)
  if (!file) return []
  return parseNoteSourceEntries(JSON.parse(file.content)).filter(
    ({ published }) => published !== false,
  )
}
