import { type Dictionary, t } from 'intlayer'

const notesPageContent = {
  key: 'page-notes',
  content: {
    metadata: {
      title: t({
        ja: 'ノート',
        en: 'Notes',
      }),
      description: t({
        ja: '短文の記録とリンク付きメモ。',
        en: 'Short notes and linked observations.',
      }),
    },
    lead: t({
      ja: 'Twitter / Bluesky の代わりに、短く書き残したいことを時系列で流していくページです。',
      en: 'A reverse-chronological short log that plays the role of my Twitter / Bluesky alternative.',
    }),
    navLabel: t({
      ja: 'ノート',
      en: 'Notes',
    }),
    navDescription: t({
      ja: '短文の記録。',
      en: 'Short-form notes.',
    }),
    openExternal: t({
      ja: 'リンクを開く',
      en: 'Open link',
    }),
    dayCountSuffix: t({
      ja: '件',
      en: 'entries',
    }),
    noteFeed: {
      body: t({
        ja: '本文',
        en: 'Body',
      }),
      parent: t({
        ja: '親ノート',
        en: 'Parent note',
      }),
      published: t({
        ja: '公開',
        en: 'Published',
      }),
      cancel: t({
        ja: 'キャンセル',
        en: 'Cancel',
      }),
      save: t({
        ja: '保存',
        en: 'Save',
      }),
      continueThread: t({
        ja: 'スレッドを続ける',
        en: 'Continue thread',
      }),
      topLevel: t({
        ja: 'トップレベル',
        en: 'Top level',
      }),
      replyPlaceholder: t({
        ja: 'このスレッドに続ける内容を書く',
        en: 'Write a follow-up note',
      }),
      noteUpdated: t({
        ja: 'ノートを更新しました',
        en: 'Note updated',
      }),
      noteDeleted: t({
        ja: 'ノートを削除しました',
        en: 'Note deleted',
      }),
      notePosted: t({
        ja: 'ノートを投稿しました',
        en: 'Note posted',
      }),
      loadError: t({
        ja: 'ノートの読込みに失敗しました。',
        en: 'Failed to load note.',
      }),
      deleteError: t({
        ja: 'ノートの削除に失敗しました。',
        en: 'Failed to delete note.',
      }),
      saveError: t({
        ja: 'ノートの保存に失敗しました。',
        en: 'Failed to save note.',
      }),
      postError: t({
        ja: 'ノートの投稿に失敗しました。',
        en: 'Failed to post note.',
      }),
      replyAction: t({
        ja: 'スレッドを続ける',
        en: 'Continue thread',
      }),
    },
  },
} satisfies Dictionary

export default notesPageContent
