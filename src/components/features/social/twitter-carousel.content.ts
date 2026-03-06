import { t, type Dictionary } from 'intlayer'

const twitterCarouselContent = {
  key: 'twitterCarousel',
  content: {
    previous: t({
      ja: '前のスライド',
      en: 'Previous slide',
    }),
    next: t({
      ja: '次のスライド',
      en: 'Next slide',
    }),
  },
} satisfies Dictionary

export default twitterCarouselContent
