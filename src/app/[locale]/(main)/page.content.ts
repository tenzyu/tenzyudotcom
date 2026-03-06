import { t, type Dictionary } from 'intlayer'

const homeContent = {
  key: 'home',
  content: {
    catchphrase: t({
      ja: '夢持って生きろ',
      en: 'Live with a dream',
    }),
    profileImageAlt: t({
      ja: 'プロフィール画像',
      en: 'Profile image',
    }),
    realName: t({
      ja: '本名 = 天珠',
      en: 'Real Name = Tenzyu',
    }),
    slogan: t({
      ja: 'SNSなんてやってないでさ、オレたちで秘密基地をつくろうよ',
      en: '"Instead of using SNS, let\'s build a secret base together."',
    }),
    dreamLabel: t({
      ja: '夢',
      en: '夢',
    }),
    nowTitle: t({
      ja: '今',
      en: 'Now',
    }),
    nowSubtitle: t({
      ja: '今の航路と、触ってほしい入口。',
      en: 'Where I am now, and where to start.',
    }),
    introTitle: t({
      ja: 'はじめて来た人へ',
      en: 'First time here',
    }),
    introLead: t({
      ja: 'はじめまして、天珠です。',
      en: "Hi, I'm Tenzyu.",
    }),
    introDetail: t({
      ja: 'いまはAIと生活設計を静かに試しています。',
      en: 'I am quietly experimenting with AI and life design.',
    }),
    growingTitle: t({
      ja: '今育てているもの',
      en: "What I'm growing",
    }),
    growingLead: t({
      ja: 'このサイトで育てているもの。',
      en: 'What I am cultivating on this site.',
    }),
    growingDetail: t({
      ja: '言葉 / 作品 / 生活の道具。',
      en: 'Words / works / tools for living.',
    }),
    entryTitle: t({
      ja: 'おすすめの入口',
      en: 'Recommended entries',
    }),
    entryLead: t({
      ja: 'まず触ってほしい3つ。',
      en: 'Three places to start.',
    }),
    entryLinks: [
      {
        href: '/blog',
        label: t({
          ja: 'ブログ',
          en: 'Blog',
        }),
      },
      {
        href: '/tools',
        label: t({
          ja: 'ツール',
          en: 'Tools',
        }),
      },
      {
        href: '/recommendations',
        label: t({
          ja: 'お気に入り',
          en: 'Favorites',
        }),
      },
    ],
    timeline: t({
      ja: '自撮り',
      en: 'Selfies',
    }),
    timelineDesc: t({
      ja: 'クリックでXに飛びます',
      en: 'Click to open X',
    }),
  },
} satisfies Dictionary

export default homeContent
