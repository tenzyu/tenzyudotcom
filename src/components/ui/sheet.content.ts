import { t, type Dictionary } from 'intlayer'

const sheetContent = {
  key: 'sheet',
  content: {
    closeLabel: t({
      ja: '閉じる',
      en: 'Close',
    }),
  },
} satisfies Dictionary

export default sheetContent
