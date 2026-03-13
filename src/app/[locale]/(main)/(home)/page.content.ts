import { type Dictionary, t } from 'intlayer'

const homeContent = {
  key: 'page-home',
  content: {
    metadata: {
      title: t({
        ja: 'tenzyu のすべてがある場所',
        en: 'All of Tenzyu in one place',
      }),
      description: t({
        ja: 'tenzyu のブログ、ノート、ツール、ポートフォリオ、リンク集への入口をまとめたホーム。人物像、仕事、記録、遊びをここから辿れます。',
        en: 'Home for Tenzyu with clear paths into the blog, notes, tools, portfolio, and links.',
      }),
    },
    catchphrase: t({
      ja: '夢持って生きろ',
      en: 'Live with a dream',
    }),
    profileImageAlt: t({
      ja: 'プロフィール画像',
      en: 'Profile image',
    }),
    profileImageFallback: 'TN',
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
      ja: 'AI、生活設計、Web 制作、日々の記録をひとつの場所にまとめています。',
      en: 'I am gathering AI, life design, web work, and daily records in one place.',
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
      ja: '言葉 / 作品 / 生活の道具 / 仕事につながる信用。',
      en: 'Words / works / tools for living / trust that can lead to work.',
    }),
    entryTitle: t({
      ja: 'おすすめの入口',
      en: 'Recommended entries',
    }),
    entryLead: t({
      ja: '最初に見るならこの3つ。',
      en: 'Three good first stops.',
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
        href: '/portfolio',
        label: t({
          ja: 'ポートフォリオ',
          en: 'Portfolio',
        }),
      },
      {
        href: '/links',
        label: t({
          ja: 'リンク',
          en: 'Links',
        }),
      },
    ],
    pathwaysTitle: t({
      ja: '目的別の入口',
      en: 'Paths by purpose',
    }),
    pathwaysSubtitle: t({
      ja: '知りたいことに合わせて入口を分けています。',
      en: 'Choose a path based on what you want to know.',
    }),
    pathways: [
      {
        title: t({
          ja: 'tenzyu という人を見たい',
          en: 'See who Tenzyu is',
        }),
        description: t({
          ja: 'リンク、ノート、Favorites、Puzzles、Pointers から、普段の感覚や遊び方が見えます。',
          en: 'Links, notes, favorites, puzzles, and pointers show how I think and play.',
        }),
        links: [
          {
            href: '/links',
            label: t({
              ja: 'リンク',
              en: 'Links',
            }),
          },
          {
            href: '/notes',
            label: t({
              ja: 'ノート',
              en: 'Notes',
            }),
          },
          {
            href: '/recommendations',
            label: t({
              ja: 'Favorites',
              en: 'Favorites',
            }),
          },
        ],
      },
      {
        title: t({
          ja: '役立つものを探したい',
          en: 'Find useful things',
        }),
        description: t({
          ja: 'ブログで知見を読み、ツールで実用品を触れます。アーカイブには過去の濃い記録も残しています。',
          en: 'Read ideas in the blog and use practical tools. The archives keep older dense records.',
        }),
        links: [
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
            href: '/archives',
            label: t({
              ja: 'アーカイブ',
              en: 'Archives',
            }),
          },
        ],
      },
      {
        title: t({
          ja: '仕事や依頼の判断をしたい',
          en: 'Evaluate me for work',
        }),
        description: t({
          ja: 'ポートフォリオで経歴を見て、ブログやツールで考え方と実装力を確認できます。',
          en: 'Use the portfolio for background, then the blog and tools for evidence of thinking and execution.',
        }),
        links: [
          {
            href: '/portfolio',
            label: t({
              ja: 'ポートフォリオ',
              en: 'Portfolio',
            }),
          },
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
        ],
      },
    ],
    siteIndexTitle: t({
      ja: 'サイト全体の索引',
      en: 'Site index',
    }),
    siteIndexSubtitle: t({
      ja: '各ページの役割を短く整理しました。',
      en: 'A quick role guide for each page.',
    }),
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
