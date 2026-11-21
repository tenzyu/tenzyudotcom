import { getLocalizedUrl } from 'intlayer'
import { loadLinks } from '@/features/links/links.assemble'

type Params = Promise<{ locale: string; shortUrl: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { locale, shortUrl } = await params
  const links = await loadLinks()
  const link = links.find((item) => item.shortenUrl === shortUrl)
  const location = link ? new URL(link.url).href : getLocalizedUrl('/', locale)
  return new Response(null, {
    status: 307,
    headers: { location },
  })
}
