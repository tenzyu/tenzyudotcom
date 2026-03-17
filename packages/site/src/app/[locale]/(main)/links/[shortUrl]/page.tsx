import { getLocalizedUrl } from 'intlayer'
import { redirect } from 'next/navigation'
import {
  getLinkByShortUrl,
  getLinkShortUrlStaticParams,
} from './_features/lib/short-url'

export async function generateStaticParams() {
  return getLinkShortUrlStaticParams()
}

type Params = Promise<{
  locale: string
  shortUrl: string
}>
export default async function RedirectPage({ params }: { params: Params }) {
  const awaitedParams = await params
  const link = await getLinkByShortUrl(awaitedParams.shortUrl)

  if (!link?.url) {
    redirect(getLocalizedUrl('/', awaitedParams.locale))
  }

  redirect(link.url)
}
