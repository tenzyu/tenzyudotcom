import Image from 'next/image'
import { MapPin, Sparkles, Gamepad2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

import { NavigationGrid } from '@/components/home/navigation-grid'
import { SelfieSection } from '@/components/home/selfie-section'
import { Badge } from '@/components/shadcn-ui/badge'
import { Button } from '@/components/shadcn-ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn-ui/card'

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
          <h1 className="text-4xl font-extrabold tracking-tight text-balance sm:text-5xl md:text-7xl">
            <span className="from-foreground via-foreground/90 to-muted-foreground bg-gradient-to-br bg-clip-text text-transparent drop-shadow-sm">
              {t('catchphrase')}
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button asChild variant="default" size="lg">
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

          <Button variant="secondary" size="lg">
            <span className="text-foreground text-sm font-bold tracking-widest">
              夢
            </span>
            <Badge variant="outline">{t('realName')}</Badge>
          </Button>
        </div>

        <span className="text-muted-foreground text-sm font-medium italic">
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
