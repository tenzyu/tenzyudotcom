import { type Dictionary, t } from 'intlayer'
import type {
  PublicRouteGroupId,
  PublicRouteId,
} from '@/features/site-navigation/public-routes.data'

const navigationTilesContent = {
  key: 'navigationTiles',
  content: {
    groups: {
      core: {
        title: t({
          ja: '主な入口',
          en: 'Core routes',
        }),
        subtitle: t({
          ja: '最初に見てほしい場所',
          en: 'The main places to start',
        }),
        items: {
          blog: {
            label: t({
              ja: 'ブログ',
              en: 'Blog',
            }),
            description: t({
              ja: '技術、試行錯誤、設計メモ。検索流入と信用の主戦場。',
              en: 'Technical writing, experiments, and design notes.',
            }),
          },
          notes: {
            label: t({
              ja: 'ノート',
              en: 'Notes',
            }),
            description: t({
              ja: '短文の記録。今の温度感や観測をいちばん早く見られます。',
              en: 'Short-form notes with the fastest signal of what I am noticing.',
            }),
          },
          tools: {
            label: t({
              ja: 'ツール',
              en: 'Tools',
            }),
            description: t({
              ja: '自作ツールや小さな実用品。これから増やしていく置き場。',
              en: 'Handmade tools and small practical utilities.',
            }),
          },
          portfolio: {
            label: t({
              ja: 'ポートフォリオ',
              en: 'Portfolio',
            }),
            description: t({
              ja: '経歴、実務、制作物。仕事や依頼の判断に必要な入口。',
              en: 'Background, experience, and projects for collaborators.',
            }),
          },
          links: {
            label: t({
              ja: 'リンク',
              en: 'Links',
            }),
            description: t({
              ja: '各種 SNS や外部サービスへの最短ハブ。',
              en: 'The quickest hub to external services and profiles.',
            }),
          },
        },
      },
      around: {
        title: t({
          ja: '周辺の棚',
          en: 'Around the site',
        }),
        subtitle: t({
          ja: 'tenzyu の趣味や私的な実用品',
          en: 'Hobbies, curation, and personal utilities',
        }),
        items: {
          recommendations: {
            label: t({
              ja: 'Favorites',
              en: 'Favorites',
            }),
            description: t({
              ja: '好きな音と動画。審美眼が出る curated shelf。',
              en: 'Curated music and videos that reflect my taste.',
            }),
          },
          pointers: {
            label: t({
              ja: 'Pointers',
              en: 'Pointers',
            }),
            description: t({
              ja: '使っている道具やリンクへの高速アクセス。',
              en: 'Fast access to tools and links I actually use.',
            }),
          },
          puzzles: {
            label: t({
              ja: 'Puzzles',
              en: 'Puzzles',
            }),
            description: t({
              ja: '解いてきた謎解きの記録。個人性のある蓄積。',
              en: 'A personal log of escape rooms and puzzle events.',
            }),
          },
          archives: {
            label: t({
              ja: 'Archives',
              en: 'Archives',
            }),
            description: t({
              ja: '過去の濃い記録や残しておきたい遺物。',
              en: 'Older dense records and artifacts worth keeping.',
            }),
          },
        },
      },
    } satisfies Record<
      PublicRouteGroupId,
      {
        title: ReturnType<typeof t>
        subtitle: ReturnType<typeof t>
        items: Partial<
          Record<
            PublicRouteId,
            { label: ReturnType<typeof t>; description: ReturnType<typeof t> }
          >
        >
      }
    >,
  },
} satisfies Dictionary

export default navigationTilesContent
