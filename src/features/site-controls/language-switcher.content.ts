import { type Dictionary, t } from 'intlayer'

const languageSwitcherContent = {
  key: 'languageSwitcher',
  content: {
    changeLanguage: t({
      ja: '言語を切り替える',
      en: 'Change language',
    }),
  },
} satisfies Dictionary

export default languageSwitcherContent
