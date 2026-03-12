import { type Dictionary, t } from 'intlayer'

const footerContent = {
  key: 'footer',
  content: {
    shareLabel: t({
      ja: '共有',
      en: 'Share',
    }),
    supportLabel: t({
      ja: 'Ko-fi で支援',
      en: 'Support on Ko-fi',
    }),
  },
} satisfies Dictionary

export default footerContent
