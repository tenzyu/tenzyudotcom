import { type Dictionary, t } from 'intlayer'

const puzzlesPageContent = {
  key: 'puzzlesPage',
  content: {
    metadata: {
      title: t({
        ja: '謎解き',
        en: 'Puzzles',
      }),
      description: t({
        ja: '解いた謎解きのアプリやウェブサイトを紹介しています。',
        en: 'Puzzle apps and websites I have solved.',
      }),
    },
    empty: {
      title: t({
        ja: '謎解きはまだありません',
        en: 'No puzzles yet',
      }),
      description: t({
        ja: 'まだ謎解きが追加されていません。',
        en: 'More puzzles will be added soon.',
      }),
    },
    categories: {
      web: {
        name: t({
          ja: 'ブラウザゲーム',
          en: 'Browser Games',
        }),
        description: t({
          ja: 'ブラウザ上で遊べる謎解き',
          en: 'Puzzles you can play in a browser',
        }),
      },
      mobile: {
        name: t({
          ja: 'スマホアプリ',
          en: 'Mobile Apps',
        }),
        description: t({
          ja: 'iOS / Android で遊べる謎解きアプリ',
          en: 'Puzzles for iOS and Android',
        }),
      },
      other: {
        name: t({
          ja: 'その他',
          en: 'Other Platforms',
        }),
        description: t({
          ja: 'Steam・Switch などのプラットフォーム',
          en: 'Steam, Switch, and other platforms',
        }),
      },
    },
    platforms: {
      web: t({
        ja: 'ウェブで遊ぶ',
        en: 'Play on the web',
      }),
      ios: t({
        ja: 'App Store で入手',
        en: 'Get on the App Store',
      }),
      android: t({
        ja: 'Google Play で入手',
        en: 'Get on Google Play',
      }),
      steam: t({
        ja: 'Steam で入手',
        en: 'Get on Steam',
      }),
      switch: t({
        ja: 'Nintendo eShop で入手',
        en: 'Get on Nintendo eShop',
      }),
      other: t({
        ja: 'リンクを開く',
        en: 'Open link',
      }),
    },
    aria: {
      thumbnailSuffix: t({
        ja: 'のサムネイル',
        en: ' thumbnail',
      }),
    },
  },
} satisfies Dictionary

export default puzzlesPageContent
