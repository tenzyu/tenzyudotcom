import { type Dictionary, t } from 'intlayer'

const scrapsPageContent = {
  key: 'page-scraps',
  content: {
    metadata: {
      title: t({
        ja: 'スクラップ',
        en: 'Scraps',
      }),
      description: t({
        ja: '仮説とログを中心に、未完成のまま育てている考えごとの作業場。',
        en: 'Working logs around a hypothesis — in-progress thinking, not finished writing.',
      }),
    },
    list: {
      empty: t({
        ja: 'まだ公開されているスクラップはありません。',
        en: 'No public scraps yet.',
      }),
      machineDraftBadge: t({
        ja: '機械下訳',
        en: 'Machine draft',
      }),
      fallbackLocaleBadge: t({
        ja: '原文言語で表示',
        en: 'Showing original locale',
      }),
    },
    status: {
      open: t({
        ja: '進行中',
        en: 'Open',
      }),
      closed: t({
        ja: 'クローズ',
        en: 'Closed',
      }),
      archived: t({
        ja: 'アーカイブ',
        en: 'Archived',
      }),
    },
    card: {
      hypothesisLabel: t({
        ja: '仮説',
        en: 'Hypothesis',
      }),
      entryCountSuffix: t({
        ja: '件のエントリ',
        en: 'entries',
      }),
      outcomesLabel: t({
        ja: '関連ブログ',
        en: 'Related posts',
      }),
      updatedPrefix: t({
        ja: '更新',
        en: 'Updated',
      }),
    },
    detail: {
      hypothesisLabel: t({
        ja: '仮説',
        en: 'Hypothesis',
      }),
      summaryLabel: t({
        ja: '概要',
        en: 'Summary',
      }),
      entriesLabel: t({
        ja: 'エントリ',
        en: 'Log',
      }),
      outcomesLabel: t({
        ja: '派生した記事',
        en: 'Derived posts',
      }),
      backToList: t({
        ja: 'スクラップ一覧へ戻る',
        en: 'Back to scraps',
      }),
      closedNotice: t({
        ja: 'このスクラップはクローズされています。派生記事への進化が完了済み、または保留として固定されました。',
        en: 'This scrap is closed. It has been promoted into derived posts or pinned as resolved.',
      }),
      machineDraftNotice: t({
        ja: 'この言語の本文は機械下訳です。検索エンジンには公開されません。',
        en: 'This locale variant is a machine draft. It is hidden from search engines.',
      }),
      fallbackLocaleNotice: t({
        ja: 'リクエストされた言語の翻訳がないため、主言語版を表示しています。',
        en: 'No reviewed translation for this locale exists, so the primary locale variant is shown.',
      }),
      missingDocumentNotice: t({
        ja: '本文を読み込めませんでした。',
        en: 'Unable to load this document.',
      }),
      adminTools: t({
        ja: '管理者ツール',
        en: 'Admin tools',
      }),
      appendEntry: t({
        ja: 'エントリを追加',
        en: 'Append entry',
      }),
      editEntry: t({
        ja: 'エントリを編集',
        en: 'Edit entry',
      }),
      saveLabel: t({
        ja: '保存',
        en: 'Save',
      }),
      cancelLabel: t({
        ja: 'キャンセル',
        en: 'Cancel',
      }),
      placeholder: t({
        ja: 'MDX を貼り付け。Evidence/Experiment/Decision/Hypothesis/Log/Todo/Claim/CounterClaim/Diff コンポーネントが使えます。',
        en: 'Paste MDX. You can use the Evidence/Experiment/Decision/Hypothesis/Log/Todo/Claim/CounterClaim/Diff components.',
      }),
      kindLabel: t({
        ja: '種別',
        en: 'Kind',
      }),
      localeLabel: t({
        ja: '言語',
        en: 'Locale',
      }),
    },
  },
} satisfies Dictionary

export default scrapsPageContent
