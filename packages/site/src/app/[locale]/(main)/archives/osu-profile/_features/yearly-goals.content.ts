import { type Dictionary, t } from 'intlayer'

const yearlyGoalsContent = {
  key: 'yearlyGoals',
  content: {
    monthNames: [
      t({ ja: '1月', en: 'Jan' }),
      t({ ja: '2月', en: 'Feb' }),
      t({ ja: '3月', en: 'Mar' }),
      t({ ja: '4月', en: 'Apr' }),
      t({ ja: '5月', en: 'May' }),
      t({ ja: '6月', en: 'Jun' }),
      t({ ja: '7月', en: 'Jul' }),
      t({ ja: '8月', en: 'Aug' }),
      t({ ja: '9月', en: 'Sep' }),
      t({ ja: '10月', en: 'Oct' }),
      t({ ja: '11月', en: 'Nov' }),
      t({ ja: '12月', en: 'Dec' }),
    ],
    goals: [
      {
        month: 4,
        title: t({
          ja: '6000位を切る',
          en: 'Break into top 6000',
        }),
      },
      {
        month: 5,
        title: t({
          ja: '5000位を切る',
          en: 'Break into top 5000',
        }),
      },
      {
        month: 6,
        title: t({
          ja: '4000位を切る',
          en: 'Break into top 4000',
        }),
      },
      {
        month: 7,
        title: t({
          ja: '3000位を切る',
          en: 'Break into top 3000',
        }),
      },
      {
        month: 8,
        title: t({
          ja: 'Twitch Partner になる',
          en: 'Become a Twitch Partner',
        }),
      },
      {
        month: 9,
        title: t({
          ja: '',
          en: '',
        }),
      },
      {
        month: 10,
        title: t({
          ja: '2000位を切る',
          en: 'Break into top 2000',
        }),
      },
      {
        month: 11,
        title: t({
          ja: '',
          en: '',
        }),
      },
      {
        month: 12,
        title: t({
          ja: '1000位を切る',
          en: 'Break into top 1000',
        }),
      },
    ],
  },
} satisfies Dictionary

export default yearlyGoalsContent
