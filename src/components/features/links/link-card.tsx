import Image from 'next/image'
import Link from 'next/link'

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { cn } from '@/lib/utils'

import type { MyLink } from '@/data/links'

type LinkCardProps = {
  link: MyLink
}

function LinkIcon({ icon }: { icon: string }) {
  return (
    <Image
      src={`/icons/${icon}.svg`}
      width={28}
      height={28}
      alt={`${icon}'s icon`}
      loading="lazy"
      quality={75}
    />
  )
}

export function LinkCard({ link }: LinkCardProps) {
  return (
    <Item asChild variant="outline" className="w-full">
      <Link
        href={`/links/${link.shortenUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${link.name} profile - ${link.id}`}
      >
        <ItemMedia
          variant="default"
          className={cn(
            'bg-primary/5 shrink-0 rounded-full',
            'dark:bg-secondary-foreground',
            'size-10',
          )}
        >
          <LinkIcon icon={link.icon} />
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
