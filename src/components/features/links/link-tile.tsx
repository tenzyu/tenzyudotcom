import { getLocalizedUrl } from 'intlayer'
import Image from 'next/image'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

import type { MyLink } from '@/data/links'

type LinkTileProps = {
  link: MyLink
}

function LinkIcon({ icon, alt }: { icon: string; alt: string }) {
  return (
    <Image
      src={`/icons/${icon}.svg`}
      width={28}
      height={28}
      alt={alt}
      loading="lazy"
      quality={75}
    />
  )
}

export function LinkTile({ link }: LinkTileProps) {
  const content = useIntlayer('page-links')
  const { locale } = useLocale()

  return (
    <Item asChild variant="card" className="w-full">
      <Link
        href={getLocalizedUrl(`/links/${link.shortenUrl}`, locale)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${content.aria.visitPrefix.value} ${link.name} (${link.id})`}
      >
        <ItemMedia variant="avatar" className="dark:bg-secondary-foreground">
          <LinkIcon
            icon={link.icon}
            alt={`${link.name} ${content.aria.iconSuffix.value}`}
          />
        </ItemMedia>

        <ItemContent className="min-w-0 text-left">
          <ItemTitle className="truncate text-sm">{link.name}</ItemTitle>
          <ItemDescription className="truncate text-xs">
            {link.id}
          </ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  )
}
