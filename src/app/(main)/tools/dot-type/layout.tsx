import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dot Type Generator',
  description:
    'テキストを入力すると、ドット絵のようなテキスト（アスキーアート風）に変換します。',
}

export default function DotTypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
