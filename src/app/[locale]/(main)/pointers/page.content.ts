import { type Dictionary, t } from 'intlayer'

const pointersPageContent = {
  key: 'pointersPage',
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
  },
} satisfies Dictionary

export default pointersPageContent
