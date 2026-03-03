import Image from 'next/image'

import { Button } from '@/components/shadcn-ui/button'

import type { FC } from 'react'

export type AboutMeProps = {
  name: string
  description: string
  imageUrl: string
  links: { label: string; url: string; ariaLabel: string }[]
}

export const AboutMeSection: FC<Partial<AboutMeProps>> = ({
  name = '天珠 (tenzyu)',
  description = '大阪府在住のフロントエンドエンジニア。React / Next.js / TypeScript を用いたWebアプリケーション開発を専門としています。',
  imageUrl = '/images/my-icon.png',
  links = [
    {
      label: 'Blog',
      url: 'https://tenzyu.com',
      ariaLabel: 'Blog',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/tenzyu',
      ariaLabel: 'GitHub',
    },
    {
      label: 'X (Twitter)',
      url: 'https://x.com/tenzyudotcom',
      ariaLabel: 'X(Twitter)',
    },
  ],
}) => (
  <div className="border-border border-b pb-8">
    <div className="flex flex-col items-start gap-6 md:flex-row">
      <div className="flex-shrink-0">
        <Image
          src={imageUrl}
          alt="Profile"
          width={120}
          height={120}
          className="border-border rounded-md border shadow-sm"
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
              variant="link"
              className="h-auto p-0"
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
    </div>
  </div>
)
