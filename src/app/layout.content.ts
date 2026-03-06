import { t, type Dictionary } from 'intlayer'

const siteContent = {
  key: 'site',
  content: {
    title: t({
      ja: 'TENZYUの秘密基地',
      en: "TENZYU's secret hideout",
    }),
    titleTemplate: t({
      ja: '%s | TENZYUの秘密基地',
      en: "%s | TENZYU's secret hideout",
    }),
    description: t({
      ja: '秘密基地',
      en: 'A secret hideout',
    }),
    shareTitle: t({
      ja: '天珠の秘密基地, tenzyu.com',
      en: "TENZYU's secret hideout, tenzyu.com",
    }),
  },
} satisfies Dictionary

export default siteContent
