import { t, type Dictionary } from 'intlayer'

const tweetImageContent = {
  key: 'tweetImage',
  content: {
    fromLabel: t({
      ja: 'Xより',
      en: 'from X',
    }),
  },
} satisfies Dictionary

export default tweetImageContent
