export type LocalizedText = {
  ja: string
  en: string
}

export type NoteSourceEntry = {
  id: string
  body: LocalizedText
  createdAt: string
  parentId?: string
  externalUrl?: string
  published?: boolean
}

export type NoteTimestampedEntry = {
  createdAt: string
}

export function compareNotesByCreatedAtDesc(
  a: NoteTimestampedEntry,
  b: NoteTimestampedEntry,
) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

export function compareNotesByCreatedAtAsc(
  a: NoteTimestampedEntry,
  b: NoteTimestampedEntry,
) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
}

export function createNoteId() {
  const now = Date.now().toString(36).padStart(10, '0')
  const randomBytes = crypto.getRandomValues(new Uint8Array(6))
  const random = Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

  return `note_${now}_${random}`
}

export function buildLocalizedNotePath(locale: string, noteId: string) {
  return `/${locale}/notes/${noteId}`
}

export function collectDescendantNoteIds(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const descendants = new Set<string>()
  const stack = [noteId]

  while (stack.length > 0) {
    const currentId = stack.pop()

    if (!currentId) {
      continue
    }

    for (const entry of entries) {
      if (entry.parentId !== currentId || descendants.has(entry.id)) {
        continue
      }

      descendants.add(entry.id)
      stack.push(entry.id)
    }
  }

  return descendants
}

export function reparentChildrenAfterNoteDelete(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const deleted = entries.find((entry) => entry.id === noteId)

  if (!deleted) {
    return [...entries]
  }

  return entries
    .filter((entry) => entry.id !== noteId)
    .map((entry) =>
      entry.parentId === noteId
        ? {
            ...entry,
            parentId: deleted.parentId,
          }
        : entry,
    )
}

export function listAvailableParentNotes(
  entries: readonly NoteSourceEntry[],
  noteId: string,
) {
  const descendantIds = collectDescendantNoteIds(entries, noteId)

  return entries.filter(
    (entry) => entry.id !== noteId && !descendantIds.has(entry.id),
  )
}
