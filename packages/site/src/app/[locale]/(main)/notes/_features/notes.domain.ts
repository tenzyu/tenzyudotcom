export type LocalizedText = {
  ja: string
  en: string
}

export type NoteSourceEntry = {
  body: LocalizedText
  createdAt: string
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
