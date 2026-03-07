import { type Dictionary, t } from 'intlayer'

const siteContent = {
  key: 'site',
  content: {
    title: {
      default: t({
        ja: '天珠の個人サイト',
        en: "TENZYU's personal website",
      }),
      template: t({
        ja: '%s | 天珠の個人サイト',
        en: "%s | TENZYU's personal website",
      }),
    },
    description: t({
      ja: '秘密基地 - fallback description  ',
      en: 'A secret hideout - fallback description',
    }),
    shareTitle: t({
      ja: '天珠の秘密基地, tenzyu.com',
      en: "TENZYU's secret hideout, tenzyu.com",
    }),
  },
} satisfies Dictionary

export default siteContent
