import { type Dictionary, t } from 'intlayer'

const archivesPageContent = {
  key: 'page-archives',
  content: {
    metadata: {
      title: t({
        ja: 'アーカイブ',
        en: 'Archives',
      }),
      description: t({
        ja: '過去のコンテンツや古いバージョンのページのアーカイブ。',
        en: 'An archive of past content and older versions of pages.',
      }),
    },
    cards: {
      osuProfileTitle: t({
        ja: 'osu! プロフィール (Legacy)',
        en: 'osu! Profile (Legacy)',
      }),
      osuProfileDescription: t({
        ja: '以前の「tenzyudotcom」のトップページに配置されていたosu!プロフィールのアーカイブ。',
        en: 'Archive of the osu! profile that used to live on the tenzyudotcom homepage.',
      }),
    },
  },
} satisfies Dictionary

export default archivesPageContent
