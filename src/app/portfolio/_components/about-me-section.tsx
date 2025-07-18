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
  name = 'About me',
  description = '大阪府在住のフロントエンドエンジニア。React/Next.js/TypeScript。',
  imageUrl = '/images/my-icon.png',
  links = [
    {
      label: 'Blog: https://tenzyu.com',
      url: 'https://tenzyu.com',
      ariaLabel: 'Blog',
    },
    {
      label: 'GitHub: https://github.com/tenzyu',
      url: 'https://github.com/tenzyu',
      ariaLabel: 'GitHub',
    },
    {
      label: 'X(Twitter): @tenzyudotcom',
      url: 'https://twitter.com/tenzyudotcom',
      ariaLabel: 'X(Twitter)',
    },
  ],
}) => (
  <div className="mx-auto w-full">
    <div className="flex flex-col items-center gap-8 py-8 md:flex-row">
      <div className="flex h-40 w-40 items-center justify-center">
        <Image
          src={imageUrl}
          alt="Profile Icon"
          width={160}
          height={160}
          className="rounded-full border-4 border-gray-200 bg-white shadow-md"
          priority
        />
      </div>
      <div className="flex-1">
        <div className="mb-2 text-center text-xl font-bold md:text-left">
          {name}
        </div>
        <p className="mb-4 text-center text-lg md:text-left">{description}</p>
        <div className="flex flex-col items-center md:items-start">
          {links.map((link) => (
            <Button asChild variant="link" key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.ariaLabel}
              >
                {link.label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </div>
  </div>
)
