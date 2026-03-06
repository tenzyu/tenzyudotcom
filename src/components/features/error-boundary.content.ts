import { t, type Dictionary } from 'intlayer'

const errorBoundaryContent = {
  key: 'errorBoundary',
  content: {
    title: t({
      ja: '問題が発生しました',
      en: 'Something went wrong!',
    }),
    fallbackMessage: t({
      ja: '予期しないエラーが発生しました',
      en: 'An unexpected error occurred',
    }),
    errorId: t({
      ja: 'エラーID:',
      en: 'Error ID:',
    }),
    retry: t({
      ja: '再試行',
      en: 'Try again',
    }),
    retrying: t({
      ja: '再試行中...',
      en: 'Retrying...',
    }),
  },
} satisfies Dictionary

export default errorBoundaryContent
