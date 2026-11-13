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
        ja: '%s | 天珠の秘密基地',
        en: "%s | Tenzyu's Secret Hideout",
      }),
    },
    description: t({
      ja: '天珠のブログ、ツール、ポートフォリオ、記録をまとめた個人サイト。',
      en: 'Personal site by Tenzyu with blog posts, tools, portfolio, and archives.',
    }),
    shareTitle: t({
      ja: '天珠の秘密基地',
      en: "Tenzyu's Secret Hideout",
    }),
  },
} satisfies Dictionary

export default siteContent
