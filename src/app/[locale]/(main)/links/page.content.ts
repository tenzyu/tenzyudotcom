import { type Dictionary, t } from 'intlayer'

const linksPageContent = {
  key: 'page-links',
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
  },
} satisfies Dictionary

export default linksPageContent
