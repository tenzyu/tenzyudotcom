import { type Dictionary, t } from 'intlayer'

const footerContent = {
  key: 'footer',
  content: {
    shareLabel: t({
      ja: '共有',
      en: 'Share',
    }),
  },
} satisfies Dictionary

export default footerContent
