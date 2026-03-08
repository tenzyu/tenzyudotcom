import { type Dictionary, t } from 'intlayer'

const shellContent = {
  key: 'shell',
  content: {
    skipToContent: t({
      ja: '本文へ移動',
      en: 'Skip to content',
    }),
    utilityNavLabel: t({
      ja: 'サイト設定',
      en: 'Site controls',
    }),
  },
} satisfies Dictionary

export default shellContent
