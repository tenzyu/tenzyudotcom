import { type Dictionary, t } from 'intlayer'

const youtubeCarouselContent = {
  key: 'youtubeCarousel',
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

export default youtubeCarouselContent
