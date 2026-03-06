import { getLocale, useIntlayer } from 'next-intlayer/server'

export async function generateMetadata() {
  const locale = await getLocale()
  const content = useIntlayer('dotType', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

export default function DotTypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
