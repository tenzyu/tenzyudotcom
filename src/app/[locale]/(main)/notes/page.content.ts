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
      ja: '短く書き残したいことを流していくページです。',
      en: 'A running page for short things I want to write down.',
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
  },
} satisfies Dictionary

export default notesPageContent
