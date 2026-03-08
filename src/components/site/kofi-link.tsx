import { Coffee } from 'lucide-react'
import { KOFI_LINK } from '@/lib/kofi'
import { Button } from '../ui/button'
import { ExternalLink } from './external-link'

type KoFiLinkProps = {
  label: string
  className?: string
  variant?: React.ComponentProps<typeof Button>['variant']
  size?: React.ComponentProps<typeof Button>['size']
}

export function KoFiLink({
  label,
  className,
  variant = 'soft',
  size = 'sm',
}: KoFiLinkProps) {
  return (
    <Button variant={variant} size={size} asChild className={className}>
      <ExternalLink href={KOFI_LINK.url} aria-label={label}>
        <Coffee className="size-4" />
        <span>{label}</span>
      </ExternalLink>
    </Button>
  )
}
