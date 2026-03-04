import { redirect } from 'next/navigation'

import { MY_LINKS } from '@/data/links'

export const dynamicParams = false
export function generateStaticParams() {
  return MY_LINKS.map((link) => ({
    shortUrl: link.shortenUrl,
  }))
}

type Params = Promise<{
  shortUrl: string
}>
export default async function RedirectPage({ params }: { params: Params }) {
  const awaited_params = await params
  redirect(`/links/${awaited_params.shortUrl}`)
}
