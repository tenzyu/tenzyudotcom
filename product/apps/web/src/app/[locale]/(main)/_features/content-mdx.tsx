import { type EvaluateOptions, evaluate } from '@mdx-js/mdx'
import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { createElement, isValidElement, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import { cn } from '@tenzyu/ui'

/**
 * Trust model: ContentMDX evaluates MDX source at render time with full
 * component support. Only pass MDX that is committed via the admin editor /
 * trusted author flow. If you ever need to render untrusted user input,
 * render Markdown or an allowlisted shortcode subset instead.
 */
export type ContentMdxScope = 'blog' | 'scrap' | 'note'

const KNOWN_CONTENT_MDX_SCOPES = ['blog', 'scrap', 'note'] as const

export function isContentMdxScope(value: unknown): value is ContentMdxScope {
  return (
    typeof value === 'string' &&
    (KNOWN_CONTENT_MDX_SCOPES as readonly string[]).includes(value)
  )
}

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\([^)]+\)/g
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\([^)]+\)/g
const MARKDOWN_INLINE_CODE_PATTERN = /`([^`]+)`/g
const MARKDOWN_EMPHASIS_PATTERN = /(\*\*|__|\*|_|~~)/g
const HTML_TAG_PATTERN = /<[^>]+>/g

const normalizeHeadingText = (value: string) =>
  value
    .replace(MARKDOWN_IMAGE_PATTERN, '$1')
    .replace(MARKDOWN_LINK_PATTERN, '$1')
    .replace(MARKDOWN_INLINE_CODE_PATTERN, '$1')
    .replace(MARKDOWN_EMPHASIS_PATTERN, '')
    .replace(HTML_TAG_PATTERN, '')
    .trim()

export function slugifyContentHeading(value: string) {
  return normalizeHeadingText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

const extractHeadingText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(extractHeadingText).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractHeadingText(node.props.children as ReactNode)
  }

  return ''
}

const buildHeadingId = (value: string, slugCounts: Map<string, number>) => {
  const baseSlug = slugifyContentHeading(value) || 'section'
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
        className={cn('wrap-break-word', className)}
        target="_blank"
        rel="noreferrer"
        {...props}
      />
    )
  }

  return (
    <Link href={href} className={cn('wrap-break-word', className)} {...props} />
  )
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

export function createBaseMdxComponents(): MDXComponents {
  const slugCounts = new Map<string, number>()

  return {
    h2: createHeading(2, slugCounts),
    h3: createHeading(3, slugCounts),
    h4: createHeading(4, slugCounts),
    a: MdxLink,
    iframe: ResponsiveIframe,
  }
}

type MDXProps = {
  components?: MDXComponents
}

type MDXComponent = React.ComponentType<MDXProps>

export type ContentMdxProps = {
  source: string
  scope: ContentMdxScope
  additionalComponents?: MDXComponents
}

const rehypePrettyCodeOptions = {
  theme: 'github-dark',
  keepBackground: true,
  defaultLang: 'plaintext',
}

/**
 * Renders trusted-author MDX content for a given content scope.
 *
 * The `scope` parameter is informational only at runtime (tagged in error
 * logs, available on the rendered tree for analytics). Scope-specific
 * component sets must be passed in via `additionalComponents` by the caller
 * to keep this module free of route-local dependencies.
 */
export async function ContentMDX({
  source,
  scope,
  additionalComponents,
}: ContentMdxProps) {
  try {
    const options: EvaluateOptions = {
      ...runtime,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
      baseUrl: import.meta.url,
    }

    const { default: MDXContent } = (await evaluate(source, options)) as {
      default: MDXComponent
    }

    const mergedComponents: MDXComponents = {
      ...createBaseMdxComponents(),
      ...(additionalComponents ?? {}),
    }

    return <MDXContent components={mergedComponents} />
  } catch (error) {
    console.error(`Error rendering MDX (scope=${scope}):`, error)
    return (
      <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4">
        {/* TODO: i18n */}
        An error occurred while rendering the content.
      </div>
    )
  }
}
