import { ArrowUpRight } from 'lucide-react'
import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/components/site/external-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

export function HomeHero() {
  const home = useIntlayer('page-home')

  return (
    <section className="relative flex flex-col items-center justify-center gap-4 py-4 text-center">
      <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
        <div className="bg-primary/40 absolute inset-0 animate-pulse rounded-full opacity-95 blur-3xl" />
        <div className="bg-primary/60 absolute inset-0 scale-110 animate-pulse rounded-full opacity-70 blur-[72px]" />
        <div className="border-border/50 bg-background relative h-full w-full overflow-hidden rounded-full border shadow-2xl ring-1 ring-black/5 transition-transform duration-700 hover:scale-105 dark:ring-white/5">
          <Avatar className="size-full">
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
              <ArrowUpRight data-icon="inline-end" className="opacity-80" />
            </span>
          </ExternalLink>
        </Button>
      </ButtonGroup>

      <span className="text-semibold bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text font-serif text-xs text-transparent italic drop-shadow-sm dark:from-teal-400 dark:to-blue-400">
        {home.slogan}
      </span>
    </section>
  )
}
