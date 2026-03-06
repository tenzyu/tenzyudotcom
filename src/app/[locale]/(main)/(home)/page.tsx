import Link from 'next/link'
import { getLocalizedUrl } from 'intlayer'
import {
  IntlayerServerProvider,
  locale,
  useIntlayer,
} from 'next-intlayer/server'

import { Clock } from 'lucide-react'

import { NavigationTiles } from './_components/navigation-tiles'
import { SelfieGallerySection } from './_components/selfie-gallery-section'
import { Button } from '@/components/ui/button'
import { NextPageIntlayer } from 'next-intlayer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ButtonGroup } from '@/components/ui/button-group'
import { ArrowUpRight } from 'lucide-react'
import { ExternalLink } from '@/components/site/external-link'

const PageContent: React.FC = () => {
  const home = useIntlayer('home')

  return (
    <>
      <section className="relative flex flex-col items-center justify-center gap-4 py-4 text-center">
        <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
          <div className="bg-primary/40 absolute inset-0 animate-pulse rounded-full opacity-95 blur-3xl" />
          <div className="bg-primary/60 absolute inset-0 scale-110 animate-pulse rounded-full opacity-70 blur-[72px]" />
          <div className="border-border/50 bg-background relative h-full w-full overflow-hidden rounded-full border shadow-2xl ring-1 ring-black/5 transition-transform duration-700 hover:scale-105 dark:ring-white/5">
            <Avatar className="h-full w-full">
              <AvatarImage
                src="/images/ltvgbz.jpg"
                alt={home.profileImageAlt.value}
              />
              <AvatarFallback>{home.profileImageFallback}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <h1 className="font-serif text-4xl font-black tracking-tighter text-balance sm:text-5xl md:text-7xl">
          <span className="bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text px-2 pb-2 text-transparent drop-shadow-sm dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400">
            {home.catchphrase}
          </span>
        </h1>

        <ButtonGroup className="flex-row-2 mt-6 items-center justify-center gap-3 sm:max-w-none">
          <Button variant="soft" size="lg" className="gap-3 shadow-sm">
            <span className="text-foreground text-sm font-bold tracking-widest">
              {home.dreamLabel}
            </span>
            <span className="bg-foreground/30 h-5 w-px" aria-hidden="true" />
            <span className="text-muted-foreground text-xs font-medium">
              {home.realName}
            </span>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="shadow-md transition-transform hover:scale-105"
          >
            <ExternalLink href="https://x.com/FlawInAffection">
              <span className="inline-flex items-center gap-2 font-bold tracking-widest">
                @FlawInAffection
                <ArrowUpRight className="h-4 w-4 opacity-80" />
              </span>
            </ExternalLink>
          </Button>
        </ButtonGroup>

        <span className="text-semibold bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text font-serif text-xs text-transparent italic drop-shadow-sm dark:from-teal-400 dark:to-blue-400">
          {home.slogan}
        </span>
      </section>
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 flex size-14 shrink-0 items-center justify-center rounded-2xl">
              <Clock className="text-primary h-7 w-7" />
            </div>
            <div className="flex flex-1 flex-col justify-center">
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
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-wide">
                {home.introTitle}
              </p>
              <p className="text-muted-foreground text-sm">{home.introLead}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {home.introDetail}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-wide">
                {home.growingTitle}
              </p>
              <p className="text-muted-foreground text-sm">
                {home.growingLead}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {home.growingDetail}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-wide">
                {home.entryTitle}
              </p>
              <p className="text-muted-foreground text-sm">{home.entryLead}</p>
              <div className="flex flex-wrap gap-2">
                {home.entryLinks.map((link) => (
                  <Button
                    key={link.href.value}
                    asChild
                    variant="soft"
                    size="sm"
                  >
                    <Link
                      href={
                        link.href.value.startsWith('/')
                          ? getLocalizedUrl(link.href.value, locale)
                          : link.href.value
                      }
                    >
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="py-4" />
      <NavigationTiles />
      <div className="py-4" />
      <SelfieGallerySection
        title={home.timeline.value}
        description={home.timelineDesc.value}
      />
    </>
  )
}

const HomePage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  return (
    <IntlayerServerProvider locale={locale}>
      <PageContent />
    </IntlayerServerProvider>
  )
}

export default HomePage
