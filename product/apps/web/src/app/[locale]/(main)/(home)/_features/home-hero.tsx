import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Button } from '@tenzyu/ui/button'
import { PageIntro } from '@tenzyu/ui/editorial'

export function HomeHero({ locale }: { locale: string }) {
  const home = useIntlayer('page-home', locale)

  return (
    <PageIntro
      eyebrow="tenzyu / osu! & engineering"
      title={home.introLead}
      description={home.introDetail}
      actions={
        <>
          <Button
            nativeButton={false}
            variant="outline"
            render={<Link href={getLocalizedUrl('/osu', locale)} />}
          >
            {home.osuLink}
          </Button>
          <Link
            href={getLocalizedUrl('/portfolio', locale)}
            className="inline-flex min-h-11 items-center px-2 text-sm underline hover:text-primary"
          >
            {home.workLink}
          </Link>
        </>
      }
    />
  )
}
