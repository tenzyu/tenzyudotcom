import { type Dictionary, t } from 'intlayer'

const osuProfilePageContent = {
  key: 'page-osu-profile',
  content: {
    metadata: {
      title: t({
        ja: 'osu! プロフィール | アーカイブ',
        en: 'osu! Profile | Archives',
      }),
      description: t({
        ja: '過去のトップページにあったosu!プロフィールのアーカイブ。',
        en: 'An archive of the past tenzyu.com landing page.',
      }),
    },
    archiveNote: t({
      ja: 'これは過去のトップページのアーカイブです。',
      en: 'This is an archive of the past tenzyu.com landing page.',
    }),
    sections: {
      osuBestScores: t({
        ja: 'ベストパフォーマンス',
        en: 'Best Scores',
      }),
      yearlyGoals: t({
        ja: '2025年の目標',
        en: '2025 Goals',
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
