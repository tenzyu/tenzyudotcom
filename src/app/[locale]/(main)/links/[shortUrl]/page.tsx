import { redirect } from 'next/navigation'
import {
  getLinkByShortUrl,
  getLinkShortUrlStaticParams,
} from './_features/lib/short-url'

export const dynamicParams = false
export function generateStaticParams() {
  return getLinkShortUrlStaticParams()
}

type Params = Promise<{
  shortUrl: string
}>
export default async function RedirectPage({ params }: { params: Params }) {
  const awaitedParams = await params
  const link = getLinkByShortUrl(awaitedParams.shortUrl)

  if (!link?.url) {
    redirect('/')
  }

  redirect(link.url)
}
