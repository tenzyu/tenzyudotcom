import Image from 'next/image'
import Link from 'next/link'

import { Card, CardContent } from '@/components/shadcn-ui/card'
import { cn } from '@/lib/utils'

import type { MyLink } from '@/data/links'

type LinkCardProps = {
  link: MyLink
}

function LinkIcon({ icon }: { icon: string }) {
  return (
    <Image
      src={`/icons/${icon}.svg`}
      width={44}
      height={44}
      alt={`${icon}'s icon`}
      loading="lazy"
      quality={75}
    />
  )
}

export function LinkCard({ link }: LinkCardProps) {
  return (
    <Link
      href={`/links/${link.shortenUrl}`}
      className="focus:ring-primary block rounded-lg focus:ring-2 focus:outline-none"
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${link.name} profile - ${link.id}`}
    >
      <Card className="hover:bg-accent dark:hover:bg-accent p-0 transition-colors">
        <CardContent className="flex flex-col items-center p-4 text-center">
          <div
            className={cn(
              'mb-3 rounded-full p-2',
              'dark:bg-secondary-foreground',
            )}
            aria-hidden="true"
          >
            <LinkIcon icon={link.icon} />
          </div>
          <h3 className="text-card-foreground mb-1 text-lg font-medium">
            {link.name}
          </h3>
          <p className="text-muted-foreground text-sm">{link.id}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
