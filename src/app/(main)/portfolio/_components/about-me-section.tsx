import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import type { FC } from 'react'

export type AboutMeProps = {
  name: string
  description: string
  imageUrl: string
  links: { label: string; url: string; ariaLabel: string }[]
}

export const AboutMeSection: FC<Partial<AboutMeProps>> = ({
  name = '天珠 (tenzyu)',
  description = '東京都在住のフロントエンドエンジニア。React / Next.js / TypeScript を用いたWebアプリケーション開発を専門としています。',
  imageUrl = '/images/my-icon.png',
  links = [
    {
      label: 'Blog',
      url: 'https://tenzyu.com/blog',
      ariaLabel: 'Blog',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/tenzyu',
      ariaLabel: 'GitHub',
    },
    {
      label: 'X',
      url: 'https://x.com/tenzyudotcom',
      ariaLabel: 'X',
    },
  ],
}) => (
  <Card variant="soft" className="p-0">
    <CardContent className="flex flex-col items-start gap-6 pt-6 md:flex-row">
      <div className="shrink-0">
        <Image
          src={imageUrl}
          alt="Profile"
          width={120}
          height={120}
          className="border-border/60 rounded-2xl border shadow-sm"
          priority
        />
      </div>
      <div className="flex flex-1 flex-col space-y-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <h2 className="text-muted-foreground text-lg">
            フロントエンドエンジニア
          </h2>
        </div>
        <p className="text-sm leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
          {links.map((link) => (
            <Button
              key={link.url}
              variant="ghost"
              className="h-auto px-0 text-primary hover:bg-transparent hover:underline"
              asChild
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.ariaLabel}
              >
                {link.label} &rarr;
              </a>
            </Button>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)
