import { t, type Dictionary } from 'intlayer'

const shareDialogContent = {
  key: 'shareDialog',
  content: {
    triggerAriaPrefix: t({
      ja: '共有',
      en: 'Share',
    }),
    titlePrefix: t({
      ja: '共有: ',
      en: 'Share ',
    }),
    copy: t({
      ja: 'コピー',
      en: 'Copy',
    }),
    email: t({
      ja: 'メール',
      en: 'Email',
    }),
    linkCopied: t({
      ja: 'リンクをコピーしました',
      en: 'Link copied to clipboard',
    }),
  },
} satisfies Dictionary

export default shareDialogContent
