import { type Dictionary, t } from 'intlayer'

const notesPageContent = {
  key: 'page-notes',
  content: {
    metadata: {
      title: t({
        ja: 'ノート',
        en: 'Notes',
      }),
      description: t({
        ja: '短文の記録とリンク付きメモ。',
        en: 'Short notes and linked observations.',
      }),
    },
    lead: t({
      ja: 'Twitter / Bluesky の代わりに、短く書き残したいことを時系列で流していくページです。',
      en: 'A reverse-chronological short log that plays the role of my Twitter / Bluesky alternative.',
    }),
    navLabel: t({
      ja: 'ノート',
      en: 'Notes',
    }),
    navDescription: t({
      ja: '短文の記録。',
      en: 'Short-form notes.',
    }),
    openExternal: t({
      ja: 'リンクを開く',
      en: 'Open link',
    }),
    dayCountSuffix: t({
      ja: '件',
      en: 'entries',
    }),
  },
} satisfies Dictionary

export default notesPageContent
