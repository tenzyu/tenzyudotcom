import { type Dictionary, t } from 'intlayer'

const editorAdminContent = {
  key: 'editorAdmin',
  content: {
    login: {
      title: t({
        ja: '編集ログイン',
        en: 'Editor Login',
      }),
      description: t({
        ja: '自分用のレコード編集画面です。',
        en: 'Private record editing dashboard.',
      }),
      passwordLabel: t({
        ja: 'パスワード',
        en: 'Password',
      }),
      submitLabel: t({
        ja: 'ログイン',
        en: 'Log in',
      }),
      invalidMessage: t({
        ja: 'パスワードが違います。',
        en: 'Incorrect password.',
      }),
      missingMessage: t({
        ja: '環境変数が未設定です。',
        en: 'Required environment variables are not configured.',
      }),
    },
    dashboard: {
      title: t({
        ja: '編集ダッシュボード',
        en: 'Editor Dashboard',
      }),
      description: t({
        ja: 'entry から見つけ、source を直接編集するための入口です。',
        en: 'A gateway for finding entries and editing canonical sources.',
      }),
      openLabel: t({
        ja: '編集する',
        en: 'Open editor',
      }),
      sourceLabel: t({
        ja: 'canonical source',
        en: 'Canonical source',
      }),
      publicPathsLabel: t({
        ja: '再検証対象',
        en: 'Revalidated paths',
      }),
      storageLabel: t({
        ja: 'storage',
        en: 'Storage',
      }),
      githubStorage: t({
        ja: 'GitHub content repo',
        en: 'GitHub content repo',
      }),
      unconfiguredStorage: t({
        ja: '未設定',
        en: 'Unconfigured',
      }),
      saveLabel: t({
        ja: '保存して再検証',
        en: 'Save and revalidate',
      }),
      savedMessage: t({
        ja: '保存しました。',
        en: 'Saved.',
      }),
      conflictMessage: t({
        ja: '他のタブや端末で更新されました。最新状態を読み直してください。',
        en: 'This collection was updated elsewhere. Reload the latest state.',
      }),
      saveErrorMessage: t({
        ja: '保存に失敗しました。storage や source の状態を確認してください。',
        en: 'Save failed. Check storage and source state.',
      }),
      sourceJsonLabel: t({
        ja: 'source JSON',
        en: 'Source JSON',
      }),
      backLabel: t({
        ja: '一覧へ戻る',
        en: 'Back to dashboard',
      }),
      logoutLabel: t({
        ja: 'ログアウト',
        en: 'Log out',
      }),
    },
    recommendationsEditor: {
      addVideo: t({
        ja: '動画を追加',
        en: 'Add video',
      }),
      addChannel: t({
        ja: 'チャンネルを追加',
        en: 'Add channel',
      }),
      published: t({
        ja: '公開する',
        en: 'Published',
      }),
      url: t({
        ja: 'URL',
        en: 'URL',
      }),
      titleField: t({
        ja: 'チャンネル名',
        en: 'Channel title',
      }),
      handleField: t({
        ja: 'ハンドル',
        en: 'Handle',
      }),
      noteJa: t({
        ja: 'ひとこと (ja)',
        en: 'Note (ja)',
      }),
      noteEn: t({
        ja: 'ひとこと (en)',
        en: 'Note (en)',
      }),
      moveUp: t({
        ja: '上へ',
        en: 'Move up',
      }),
      moveDown: t({
        ja: '下へ',
        en: 'Move down',
      }),
      remove: t({
        ja: '削除',
        en: 'Remove',
      }),
      preview: t({
        ja: 'プレビュー',
        en: 'Preview',
      }),
      autoFetched: t({
        ja: '保存後に YouTube API からタイトルと再生数を補います。',
        en: 'Title and views are filled from the YouTube API after save.',
      }),
      channelHint: t({
        ja: 'チャンネルは今のところタイトルとハンドルを手入力します。',
        en: 'Channels still require a manual title and handle for now.',
      }),
      videoType: t({
        ja: 'YouTube 動画',
        en: 'YouTube Video',
      }),
      channelType: t({
        ja: 'YouTube チャンネル',
        en: 'YouTube Channel',
      }),
    },
    linksEditor: {
      add: t({
        ja: 'リンクを追加',
        en: 'Add link',
      }),
      name: t({
        ja: '表示名',
        en: 'Display name',
      }),
      id: t({
        ja: '補足 ID',
        en: 'Secondary ID',
      }),
      url: t({
        ja: 'URL',
        en: 'URL',
      }),
      shortenUrl: t({
        ja: '短縮 URL',
        en: 'Short URL',
      }),
      icon: t({
        ja: 'アイコン名',
        en: 'Icon name',
      }),
      category: t({
        ja: 'カテゴリ',
        en: 'Category',
      }),
    },
    notesEditor: {
      add: t({
        ja: 'ノートを追加',
        en: 'Add note',
      }),
      bodyJa: t({
        ja: '本文 (ja)',
        en: 'Body (ja)',
      }),
      bodyEn: t({
        ja: '本文 (en)',
        en: 'Body (en)',
      }),
      createdAt: t({
        ja: '作成日時 (ISO)',
        en: 'Created at (ISO)',
      }),
      externalUrl: t({
        ja: '外部 URL',
        en: 'External URL',
      }),
      published: t({
        ja: '公開する',
        en: 'Published',
      }),
    },
    pointersEditor: {
      addLink: t({
        ja: 'リンクを追加',
        en: 'Add link',
      }),
      categoryTitleJa: t({
        ja: 'カテゴリ名 (ja)',
        en: 'Category title (ja)',
      }),
      categoryTitleEn: t({
        ja: 'カテゴリ名 (en)',
        en: 'Category title (en)',
      }),
      categoryDescriptionJa: t({
        ja: 'カテゴリ説明 (ja)',
        en: 'Category description (ja)',
      }),
      categoryDescriptionEn: t({
        ja: 'カテゴリ説明 (en)',
        en: 'Category description (en)',
      }),
      linkTitleJa: t({
        ja: 'リンク名 (ja)',
        en: 'Link title (ja)',
      }),
      linkTitleEn: t({
        ja: 'リンク名 (en)',
        en: 'Link title (en)',
      }),
      linkDescriptionJa: t({
        ja: 'リンク説明 (ja)',
        en: 'Link description (ja)',
      }),
      linkDescriptionEn: t({
        ja: 'リンク説明 (en)',
        en: 'Link description (en)',
      }),
      linkId: t({
        ja: 'リンク ID',
        en: 'Link ID',
      }),
      url: t({
        ja: 'URL',
        en: 'URL',
      }),
      isApp: t({
        ja: 'アプリ deep link',
        en: 'App deep link',
      }),
    },
    puzzlesEditor: {
      addPuzzle: t({
        ja: 'パズルを追加',
        en: 'Add puzzle',
      }),
      addLink: t({
        ja: 'リンクを追加',
        en: 'Add link',
      }),
      title: t({
        ja: 'タイトル',
        en: 'Title',
      }),
      primaryUrl: t({
        ja: '優先 URL',
        en: 'Primary URL',
      }),
      linkUrl: t({
        ja: 'リンク URL',
        en: 'Link URL',
      }),
      platform: t({
        ja: 'プラットフォーム',
        en: 'Platform',
      }),
    },
  },
} satisfies Dictionary

export default editorAdminContent
