type LocalizedText = {
  ja: string
  en: string
}

export type NoteSourceEntry = {
  body: LocalizedText
  createdAt: string
  externalUrl?: string
  published?: boolean
}

export const NOTE_SOURCE_ENTRIES: readonly NoteSourceEntry[] = [
  {
    body: {
      ja: '短文の記録置き場。Twitter や Bluesky みたいな感覚で使う予定です。',
      en: 'A place for short notes. I plan to use it more like Twitter or Bluesky.',
    },
    createdAt: '2026-03-08T00:00:00+09:00',
    published: true,
  },
] as const
