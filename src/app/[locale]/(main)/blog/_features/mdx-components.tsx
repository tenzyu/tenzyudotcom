import Link from 'next/link'
import type { MDXComponents } from 'mdx/types'
import { createElement, type ReactNode } from 'react'
import { cn } from '@/lib/utils/common'
import { slugifyBlogHeading } from './blog.domain'

import { KoFiLink } from '@/app/[locale]/_features/shell/kofi-link'
import { OtakuAside } from '../../_features/otaku-aside'
import { CautionAlert } from './caution-alert'

const extractHeadingText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(extractHeadingText).join('')
  }

  if (node && typeof node === 'object' && 'props' in node) {
    return extractHeadingText(node.props.children as ReactNode)
  }

  return ''
}

const buildHeadingId = (value: string, slugCounts: Map<string, number>) => {
  const baseSlug = slugifyBlogHeading(value) || 'section'
  const count = slugCounts.get(baseSlug) ?? 0
  slugCounts.set(baseSlug, count + 1)
  return count === 0 ? baseSlug : `${baseSlug}-${count}`
}

function createHeading(level: 2 | 3 | 4, slugCounts: Map<string, number>) {
  const tagName = `h${level}` as const

  return function Heading({
    children,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof tagName>) {
    const headingText = extractHeadingText(children)
    const id = buildHeadingId(headingText, slugCounts)

    return createElement(
      tagName,
      {
        ...props,
        id,
        className: cn('group', className),
      },
      children,
    )
  }
}

function MdxLink({
  href,
  className,
  ...props
}: React.ComponentPropsWithoutRef<'a'>) {
  if (!href) {
    return <a className={className} {...props} />
  }

  const isExternal =
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('//')

  if (isExternal) {
    return (
      <a
        href={href}
        className={cn('break-words', className)}
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    )
  }

  return <Link href={href} className={cn('break-words', className)} {...props} />
}

function ResponsiveIframe(props: React.ComponentPropsWithoutRef<'iframe'>) {
  return (
    <span className="my-8 block overflow-hidden rounded-2xl border border-border/60">
      <span className="bg-muted/30 relative block aspect-video w-full">
        <iframe
          {...props}
          className={cn('absolute inset-0 h-full w-full', props.className)}
        />
      </span>
    </span>
  )
}

export const components: MDXComponents = {
  OtakuAside,
  CautionAlert,
  KoFiLink,
}

export function createMdxComponents(): MDXComponents {
  const slugCounts = new Map<string, number>()

  return {
    ...components,
    h2: createHeading(2, slugCounts),
    h3: createHeading(3, slugCounts),
    h4: createHeading(4, slugCounts),
    a: MdxLink,
    iframe: ResponsiveIframe,
  }
}
