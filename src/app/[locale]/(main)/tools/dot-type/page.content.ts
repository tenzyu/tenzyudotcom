import { t, type Dictionary } from 'intlayer'

const dotTypeContent = {
  key: 'dotType',
  content: {
    metadata: {
      title: t({
        ja: 'Dot Type Generator',
        en: 'Dot Type Generator',
      }),
      description: t({
        ja: 'テキストを入力すると、ドット絵のようなテキスト（アスキーアート風）に変換します。',
        en: 'Enter text to generate dot-style ASCII art.',
      }),
    },
    hero: {
      title: t({
        ja: 'Dot Type Generator',
        en: 'Dot Type Generator',
      }),
      description: t({
        ja: 'テキストを入力すると、ドット絵のようなテキスト（アスキーアート風）に変換します。TwitterなどのSNSでの投稿に最適です。',
        en: 'Convert text into dot-style ASCII art. Great for sharing on social media.',
      }),
    },
    labels: {
      inputText: t({
        ja: '入力テキスト',
        en: 'Input text',
      }),
      inputPlaceholder: t({
        ja: 'テキストを入力してください',
        en: 'Type your text here',
      }),
      orientation: t({
        ja: '文字の向き',
        en: 'Text orientation',
      }),
      horizontal: t({
        ja: '横書き',
        en: 'Horizontal',
      }),
      vertical: t({
        ja: '縦書き',
        en: 'Vertical',
      }),
      fontSize: t({
        ja: 'フォントサイズ / グリッドサイズ (px)',
        en: 'Font size / grid size (px)',
      }),
      threshold: t({
        ja: 'しきい値 (0-255)',
        en: 'Threshold (0-255)',
      }),
      pixelChar: t({
        ja: '使用文字 (黒)',
        en: 'Pixel character (dark)',
      }),
      emptyChar: t({
        ja: '背景文字 (白)',
        en: 'Background character (light)',
      }),
      preview: t({
        ja: 'プレビュー (コピーして使用してください)',
        en: 'Preview (copy to use)',
      }),
      copy: t({
        ja: 'コピー',
        en: 'Copy',
      }),
      copied: t({
        ja: 'コピーしました',
        en: 'Copied',
      }),
    },
    defaults: {
      inputText: t({
        ja: 'どっとたいぷ',
        en: 'dot type',
      }),
    },
  },
} satisfies Dictionary

export default dotTypeContent
