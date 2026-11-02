import { type Dictionary, t } from 'intlayer'

const osuProfilePageContent = {
  key: 'page-osu-profile',
  content: {
    metadata: {
      title: t({
        ja: 'osu! | 天珠',
        en: 'osu! | Tenzyu',
      }),
      description: t({
        ja: '天珠のosu!プロフィール、ベストスコア、プレイ動画、年代別のデバイス設定。',
        en: "Tenzyu's osu! profile, best scores, gameplay videos, and device settings by era.",
      }),
    },
    introduction: t({
      ja: 'osu!のプロフィール、プレイの記録とデバイス設定。ランキングとベストスコアはosu! APIから取得しています。',
      en: 'My osu! profile, play history, and device settings. Rankings and best scores are fetched from the osu! API.',
    }),
    linksUnavailable: t({
      ja: 'リンク集を現在取得できません。osu!とTwitchのプロフィールリンクは上部に掲載しています。',
      en: 'The link collection is currently unavailable. The osu! and Twitch profile links are listed above.',
    }),
    tableOfContents: t({
      ja: '目次',
      en: 'Table of Contents',
    }),
    sections: {
      osuBestScores: t({
        ja: 'ベストパフォーマンス',
        en: 'Best Scores',
      }),
      personalBestHistory: t({
        ja: 'BP更新履歴',
        en: 'Personal Best History',
      }),
      featuredVideos: t({
        ja: 'おすすめ動画',
        en: 'Featured Videos',
      }),
      twitterClips: t({
        ja: 'Twitter クリップ',
        en: 'Twitter Clips',
      }),
      twitterNote: t({
        ja: '*ブラウザのトラッキングプロテクションで画像／動画が表示されない場合があります。',
        en: '*Images/videos may not display if your browser has tracking protection enabled.',
      }),
      osuSettings: t({
        ja: 'osu! 設定',
        en: 'osu! Settings',
      }),
      myLinks: t({
        ja: 'リンク集',
        en: 'My Links',
      }),
    },
  },
} satisfies Dictionary

export default osuProfilePageContent
