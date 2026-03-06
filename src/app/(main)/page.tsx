import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ArrowUpRight, Clock } from 'lucide-react'

import { NavigationTiles } from './_components/navigation-tiles'
import { SelfieGallerySection } from './_components/selfie-gallery-section'
import { ExternalLink } from '@/components/site/external-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'

const ENTRY_LINKS = [
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/tools',
    label: 'Tools',
  },
  {
    href: '/recommendations',
    label: 'Recommendations',
  },
] as const

export default async function Home() {
  const t = await getTranslations('home')
  return (
    <>
      {/* HeroSection */}
      <section className="relative flex flex-col items-center justify-center gap-4 py-4 text-center">
        <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
          <div className="bg-primary/40 absolute inset-0 animate-pulse rounded-full blur-3xl opacity-95" />
          <div className="bg-primary/60 absolute inset-0 scale-110 animate-pulse rounded-full blur-[72px] opacity-70" />
          <div className="border-border/50 bg-background relative h-full w-full overflow-hidden rounded-full border shadow-2xl ring-1 ring-black/5 transition-transform duration-700 hover:scale-105 dark:ring-white/5">
            <Avatar className="h-full w-full">
              <AvatarImage src="/images/ltvgbz.jpg" alt="Profile" />
              <AvatarFallback>TN</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <h1 className="font-serif text-4xl font-black tracking-tighter text-balance sm:text-5xl md:text-7xl">
          <span className="bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text px-2 pb-2 text-transparent drop-shadow-sm dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400">
            {t('catchphrase')}
          </span>
        </h1>

        <ButtonGroup className="flex-row-2 mt-6 items-center justify-center gap-3 sm:max-w-none">
          <Button variant="soft" size="lg" className="gap-3 shadow-sm">
            <span className="text-foreground text-sm font-bold tracking-widest">
              夢
            </span>
            <span className="bg-foreground/30 h-5 w-px" aria-hidden="true" />
            <span className="text-muted-foreground text-xs font-medium">
              {t('realName')}
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

        <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text text-sm font-semibold text-transparent italic drop-shadow-sm dark:from-teal-400 dark:to-blue-400 font-[var(--font-shippori)]">
          {t('slogan')}
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
                <h2 className="text-2xl font-bold tracking-tight">Now</h2>
                <div className="bg-border/50 h-px flex-1" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                今の航路と、触ってほしい入口。
              </p>
            </div>
          </div>
        </div>
        <div className="border-border/60 bg-card/40 rounded-2xl border p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr] md:gap-5 md:divide-x md:divide-border/60 md:[&>div]:px-4 md:[&>div:first-child]:pl-0 md:[&>div:last-child]:pr-0">
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-wide">
                はじめて来た人へ
              </p>
              <p className="text-muted-foreground text-sm">
                はじめまして、天珠です。
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                いまはAIと生活設計を静かに試しています。
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-wide">
                今育てているもの
              </p>
              <p className="text-muted-foreground text-sm">
                このサイトで育てているもの。
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                言葉 / 作品 / 生活の道具。
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-wide">
                おすすめの入口
              </p>
              <p className="text-muted-foreground text-sm">
                まず触ってほしい3つ。
              </p>
              <div className="flex flex-wrap gap-2">
                {ENTRY_LINKS.map((link) => (
                  <Button key={link.href} asChild variant="soft" size="sm">
                    <Link href={link.href}>{link.label}</Link>
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
        title={t('timeline')}
        description={t('timelineDesc')}
      />
    </>
  )
}
