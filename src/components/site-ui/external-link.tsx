import * as React from 'react'
import { cn } from '@/lib/utils/common'

type ExternalLinkProps = React.ComponentPropsWithoutRef<'a'>

export const ExternalLink = React.forwardRef<
  HTMLAnchorElement,
  ExternalLinkProps
>(({ className, rel, target, ...props }, ref) => (
  <a
    ref={ref}
    target={target ?? '_blank'}
    rel={rel ?? 'noopener noreferrer'}
    className={cn(className)}
    {...props}
  />
))

ExternalLink.displayName = 'ExternalLink'
