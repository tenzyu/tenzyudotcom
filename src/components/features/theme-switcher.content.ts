import { t, type Dictionary } from 'intlayer'

const themeSwitcherContent = {
  key: 'themeSwitcher',
  content: {
    toggleLabel: t({
      ja: 'テーマを切り替える',
      en: 'Toggle theme',
    }),
  },
} satisfies Dictionary

export default themeSwitcherContent
