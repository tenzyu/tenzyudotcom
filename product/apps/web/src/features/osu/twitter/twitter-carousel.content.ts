import { type Dictionary, t } from 'intlayer'

const twitterCarouselContent = {
  key: 'twitterCarousel',
  content: {
    viewPost: t({ ja: 'Xで投稿を見る', en: 'View post on X' }),
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
