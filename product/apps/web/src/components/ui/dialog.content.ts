import { type Dictionary, t } from 'intlayer'

const dialogContent = {
  key: 'dialog',
  content: {
    closeLabel: t({
      ja: '閉じる',
      en: 'Close',
    }),
  },
} satisfies Dictionary

export default dialogContent
