import { getLocalizedUrl } from 'intlayer'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Button } from '@/components/ui/button'

export function HomeNowSection({ locale }: { locale: string }) {
  const home = useIntlayer('page-home')
  const entryLinks = home.entryLinks as ReadonlyArray<{
    href: { value: string }
    label: string
  }>

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <Clock className="text-primary h-7 w-7" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {home.nowTitle}
              </h2>
              <div className="bg-border/50 h-px flex-1" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              {home.nowSubtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="border-border/60 bg-card/40 rounded-2xl border p-4 sm:p-5">
        <div className="md:divide-border/60 grid gap-4 md:grid-cols-[1.2fr_1fr_1fr] md:gap-5 md:divide-x md:[&>div]:px-4 md:[&>div:first-child]:pl-0 md:[&>div:last-child]:pr-0">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-wide">
              {home.introTitle}
            </p>
            <p className="text-muted-foreground text-sm">{home.introLead}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {home.introDetail}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-wide">
              {home.growingTitle}
            </p>
            <p className="text-muted-foreground text-sm">{home.growingLead}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {home.growingDetail}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold tracking-wide">
              {home.entryTitle}
            </p>
            <p className="text-muted-foreground text-sm">{home.entryLead}</p>
            <div className="flex flex-wrap gap-2">
              {entryLinks.map((link) => (
                <Button key={link.href.value} asChild variant="soft" size="sm">
                  <Link href={getLocalizedUrl(link.href.value, locale)}>
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
