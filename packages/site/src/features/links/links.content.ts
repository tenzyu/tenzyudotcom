import { type Dictionary, t } from 'intlayer'

const linksFeatureContent = {
  key: 'linksFeature',
  content: {
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

export default linksFeatureContent
