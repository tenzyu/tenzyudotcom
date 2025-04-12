import { MY_LINKS } from '@/data/links'
import { redirect } from 'next/navigation'

export function generateStaticParams() {
  return MY_LINKS.map(link => ({
    shortUrl: link.shortenUrl,
  }))
}

type Params = Promise<{
  shortUrl: string
}>
export default async function RedirectPage({ params }: { params: Params }) {
  const awaited_params = await params
  const link = MY_LINKS.find(
    link => link.shortenUrl === awaited_params.shortUrl,
  )

  if (!link?.url) {
    redirect('/')
  }

  redirect(link.url)
}
