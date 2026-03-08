import { Coffee } from 'lucide-react'
import { Button } from '../ui/button'
import { ExternalLink } from './external-link'

const KOFI_URL = 'https://ko-fi.com/tenzyu'

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
      <ExternalLink href={KOFI_URL} aria-label={label}>
        <Coffee className="size-4" />
        <span>{label}</span>
      </ExternalLink>
    </Button>
  )
}
