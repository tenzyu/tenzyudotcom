import { MY_LINKS } from '@/data/links'
import { redirect } from 'next/navigation'

export default async function RedirectPage({
  params,
}: { params: Promise<{ shortUrl: string }> }) {
  const unwrap_params = await params
  const link = MY_LINKS.find(link => link.shortenUrl === unwrap_params.shortUrl)

  if (!link?.url) {
    redirect('/')
  }

  redirect(link.url)
}
