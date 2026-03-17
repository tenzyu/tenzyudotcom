import * as React from 'react'
import { cn } from '@/lib/utils/common'
import { normalizeExternalUrl } from '@/lib/url/external-url.domain'

type ExternalLinkProps = Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string
}

export const ExternalLink = React.forwardRef<
  HTMLAnchorElement,
  ExternalLinkProps
>(({ className, href, referrerPolicy, rel, target, ...props }, ref) => {
  const normalizedHref = normalizeExternalUrl(href, 'ExternalLink href')

  return (
    <a
      ref={ref}
      href={normalizedHref}
      target={target ?? '_blank'}
      rel={rel ?? 'noopener noreferrer'}
      referrerPolicy={referrerPolicy ?? 'strict-origin-when-cross-origin'}
      className={cn(className)}
      {...props}
    />
  )
})

ExternalLink.displayName = 'ExternalLink'
