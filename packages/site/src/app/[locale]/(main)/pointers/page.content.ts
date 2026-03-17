import { type Dictionary, t } from 'intlayer'

const pointersPageContent = {
  key: 'page-pointers',
  content: {
    metadata: {
      title: t({
        ja: 'ポインタ',
        en: 'Pointers',
      }),
      description: t({
        ja: '日常用のクイックアクセスダッシュボード。',
        en: 'Quick access dashboard for personal daily use.',
      }),
    },
    lead: t({
      ja: '普段すぐ開く AI や作業ツールを、迷わず触れるように並べた私用ダッシュボードです。',
      en: 'A personal dashboard for the AI and productivity tools I open on autopilot.',
    }),
  },
} satisfies Dictionary

export default pointersPageContent
