export type LocalizedText = {
  ja: string
  en: string
}

export type ToolEntry = {
  title: LocalizedText
  description: LocalizedText
  note: LocalizedText
  href: string
  icon: 'type'
}

export const TOOLS: ToolEntry[] = [
  {
    title: {
      ja: 'Dot Type Generator',
      en: 'Dot Type Generator',
    },
    description: {
      ja: 'テキストをドット絵風のアスキーアートに変換するジェネレーター。',
      en: 'Generate dot-style ASCII art from text.',
    },
    note: {
      ja: '配信用の見た目を即席で変えたいときに、入力→調整→出力を最短で回すための道具。',
      en: 'Built to sprint through input → tweak → output when I need a quick visual shift.',
    },
    href: '/tools/dot-type',
    icon: 'type',
  },
]
