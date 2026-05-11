import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useIntlayer } from 'next-intlayer/server'
import { ExternalLink } from '@/app/[locale]/_features/external-link'
import { Avatar, AvatarFallback, AvatarImage } from '@tenzyu/ui/avatar'
import { Badge } from '@tenzyu/ui/badge'
import { Button } from '@tenzyu/ui/button'

export function HomeHero() {
  const home = useIntlayer('page-home')

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-card/50 px-5 py-10 text-center shadow-[var(--shadow-surface)] backdrop-blur-xl sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-primary/12 blur-3xl" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5">
        <div className="relative h-32 w-32 sm:h-40 sm:w-40">
          <div className="absolute inset-0 rounded-full bg-primary/25 blur-3xl" />
          <div className="relative h-full w-full overflow-hidden rounded-full border border-border/60 bg-background shadow-[var(--shadow-lifted)] ring-1 ring-primary/15">
            <Avatar className="size-full">
              <AvatarImage
                src="/images/ltvgbz.jpg"
                alt={home.profileImageAlt.value}
              />
              <AvatarFallback>{home.profileImageFallback}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <Badge
          variant="outline"
          className="gap-2 border-primary/30 bg-primary/8 px-3 py-1 text-primary"
        >
          <Sparkles className="size-3" />
          {home.dreamLabel} / {home.realName}
        </Badge>

        <h1 className="font-serif text-4xl font-black tracking-[-0.07em] text-balance sm:text-5xl md:text-7xl">
          <span className="bg-linear-to-r from-primary via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            {home.catchphrase}
          </span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-sm leading-7 sm:text-base">
          {home.slogan}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild size="lg" className="shadow-[var(--shadow-accent)]">
            <ExternalLink href="https://x.com/FlawInAffection">
              <span className="inline-flex items-center gap-2 font-bold tracking-widest">
                @FlawInAffection
                <ArrowUpRight data-icon="inline-end" className="opacity-80" />
              </span>
            </ExternalLink>
          </Button>
        </div>
      </div>
    </section>
  )
}
