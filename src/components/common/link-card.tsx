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
    <Link
      href={`/links/${link.shortenUrl}`}
      className="focus:ring-primary block rounded-xl focus:ring-2 focus:outline-none"
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit ${link.name} profile - ${link.id}`}
    >
      <Card className="hover:bg-accent dark:hover:bg-accent border-border/50 p-0 transition-colors">
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={cn(
              'bg-primary/5 shrink-0 rounded-full p-2',
              'dark:bg-secondary-foreground',
            )}
            aria-hidden="true"
          >
            <LinkIcon icon={link.icon} />
          </div>
          <div className="flex min-w-0 flex-col text-left">
            <h3 className="text-card-foreground truncate text-sm font-semibold tracking-tight">
              {link.name}
            </h3>
            <p className="text-muted-foreground truncate text-xs font-medium">
              {link.id}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
