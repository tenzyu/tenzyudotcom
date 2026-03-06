import Image from 'next/image'
import { MapPin, Sparkles, Gamepad2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { NavigationGrid } from '@/components/features/home/navigation-grid'
import { SelfieSection } from '@/components/features/home/selfie-section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function Home() {
  const t = await getTranslations('home')
  return (
    <>
      {/* HeroSection */}
      <section className="relative flex flex-col items-center justify-center gap-4 py-4 text-center sm:py-12">
        <div className="relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
          <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-3xl" />
          <div className="border-border/50 bg-background relative h-full w-full overflow-hidden rounded-full border shadow-2xl ring-1 ring-black/5 transition-transform duration-700 hover:scale-105 dark:ring-white/5">
            <Image
              src="/images/ltvgbz.jpg"
              alt="Profile"
              width={176}
              height={176}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <h1 className="font-serif text-4xl font-black tracking-tighter text-balance sm:text-5xl md:text-7xl">
            <span className="bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text px-2 pb-2 text-transparent drop-shadow-sm dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400">
              {t('catchphrase')}
            </span>
          </h1>
        </div>

        <div className="mt-6 flex w-full max-w-sm flex-col items-center justify-center gap-4 sm:w-auto sm:max-w-none sm:flex-row">
          <Button
            variant="secondary"
            size="lg"
            className="w-full shadow-sm transition-transform hover:scale-105 sm:w-auto"
          >
            <span className="text-foreground text-sm font-bold tracking-widest">
              夢
            </span>
            <Badge className="bg-background/50 border-border ml-1">
              {t('realName')}
            </Badge>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full shadow-md transition-transform hover:scale-105 sm:w-auto"
          >
            <a
              href="https://x.com/FlawInAffection"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <span className="font-bold tracking-widest">
                @FlawInAffection
              </span>
            </a>
          </Button>
        </div>

        <span className="bg-linear-to-r from-teal-500 to-blue-500 bg-clip-text font-serif text-sm font-medium text-transparent italic drop-shadow-sm dark:from-teal-400 dark:to-blue-400">
          {t('slogan')}
        </span>

        <Card>
          <CardHeader>
            <CardTitle className="text-left text-xl font-bold tracking-tight">
              <p className="flex items-center gap-3">
                <MapPin className="text-primary h-8 w-8 shrink-0" />
                <span>Now in Tokyo, Japan</span>
              </p>
            </CardTitle>
          </CardHeader>

          <CardContent className="text-muted-foreground space-y-4 text-left text-sm/relaxed">
            <p className="flex items-center gap-3">
              <Sparkles className="text-primary h-4 w-4 shrink-0" />
              <span>
                Exploring the mindset and possibilities of using AI.
                <span className="mt-1 block text-xs opacity-70">
                  (By the way, this site is also built using AI)
                </span>
              </span>
            </p>
            <p className="flex items-center gap-3">
              <Gamepad2 className="text-primary h-4 w-4 shrink-0" />
              <span>
                AIとサイトと生活設計を使って、摩擦の少ない、自分主導の収益と居場所を作ろうとしてる
              </span>
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="py-4" />

      <NavigationGrid />

      <div className="py-4" />

      <SelfieSection title={t('timeline')} description={t('timelineDesc')} />
    </>
  )
}
