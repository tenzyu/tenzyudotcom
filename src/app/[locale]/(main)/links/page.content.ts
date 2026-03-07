import { type Dictionary, t } from 'intlayer'

const linksPageContent = {
  key: 'linksPage',
  content: {
    metadata: {
      title: t({
        ja: 'リンク集',
        en: 'Links',
      }),
      description: t({
        ja: '各種リンクをまとめています。',
        en: 'A collection of my links.',
      }),
    },
    categories: {
      watch: t({
        ja: '📺 視聴',
        en: '📺 Watch',
      }),
      social: t({
        ja: '🌐 ソーシャル',
        en: '🌐 Social',
      }),
      build: t({
        ja: '🛠️ ビルド',
        en: '🛠️ Build',
      }),
      legacy: t({
        ja: '🏛️ レガシー',
        en: '🏛️ Legacy',
      }),
    },
    aria: {
      groupLabelSuffix: t({
        ja: 'リンク',
        en: 'links',
      }),
      visitPrefix: t({
        ja: '開く',
        en: 'Visit',
      }),
      iconSuffix: t({
        ja: 'のアイコン',
        en: 'icon',
      }),
    },
  },
} satisfies Dictionary

export default linksPageContent
