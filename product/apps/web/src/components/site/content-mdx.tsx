import { type EvaluateOptions, evaluate } from '@mdx-js/mdx'
import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import { createElement, isValidElement, type ReactNode } from 'react'
import * as runtime from 'react/jsx-runtime'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'
import { cn } from '@tenzyu/ui'
import { type BlogHeading, slugifyBlogHeading } from '@tenzyu/publishing-domain/blog'

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

type HeadingIds = {
  used: Set<string>
  nextSuffix: Map<string, number>
}

function allocateHeadingId(title: string, ids: HeadingIds) {
  const base = slugifyBlogHeading(title) || 'section'
  let id = base
  if (ids.used.has(id)) {
    let count = ids.nextSuffix.get(base) ?? 1
    do {
      id = `${base}-${count++}`
    } while (ids.used.has(id))
    ids.nextSuffix.set(base, count)
  }
  ids.used.add(id)
  return id
}

type HeadingTree = {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HeadingTree[]
}

function staticHeadingText(node: HeadingTree): string | undefined {
  if (node.type === 'text') return node.value ?? ''
  if (node.type.startsWith('mdx')) return undefined
  let title = ''
  for (const child of node.children ?? []) {
    const text = staticHeadingText(child)
    if (text === undefined) return undefined
    title += text
  }
  return title
}

function projectHeadings(headings: BlogHeading[], ids: HeadingIds) {
  return () => (tree: HeadingTree) => {
    function visit(node: HeadingTree) {
      if (
        node.type === 'element' &&
        (node.tagName === 'h2' || node.tagName === 'h3' || node.tagName === 'h4')
      ) {
        const title = staticHeadingText(node)
        if (title !== undefined) {
          const id = allocateHeadingId(title, ids)
          node.properties = { ...node.properties, id }
          if (node.tagName !== 'h4') {
            headings.push({ id, title, level: node.tagName === 'h2' ? 2 : 3 })
          }
        }
      }
      for (const child of node.children ?? []) visit(child)
    }
    visit(tree)
  }
}

function createHeading(level: 2 | 3 | 4, ids: HeadingIds) {
  const tagName = `h${level}` as const

  return function Heading({
    children,
    className,
    id,
    ...props
  }: React.ComponentPropsWithoutRef<typeof tagName>) {
    return createElement(
      tagName,
      {
        ...props,
        id: id ?? allocateHeadingId(extractHeadingText(children), ids),
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

function createBaseMdxComponents(ids: HeadingIds): MDXComponents {
  return {
    h2: createHeading(2, ids),
    h3: createHeading(3, ids),
    h4: createHeading(4, ids),
    a: MdxLink,
    iframe: ResponsiveIframe,
  }
}

type MDXProps = {
  components?: MDXComponents
}

type MDXComponent = React.ComponentType<MDXProps>

function RenderPreparedContent({
  MDXContent,
  staticIds,
  additionalComponents,
}: {
  MDXContent: MDXComponent
  staticIds: HeadingIds
  additionalComponents?: MDXComponents
}) {
  // Static IDs are reserved once at compilation. Dynamic allocation belongs
  // to this rendering, not to the reusable prepared element.
  const ids: HeadingIds = {
    used: new Set(staticIds.used),
    nextSuffix: new Map(staticIds.nextSuffix),
  }
  const components: MDXComponents = {
    ...createBaseMdxComponents(ids),
    ...(additionalComponents ?? {}),
  }
  return <MDXContent components={components} />
}

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
export async function prepareContentMDX({
  source,
  scope,
  additionalComponents,
}: ContentMdxProps) {
  const headings: BlogHeading[] = []
  const ids: HeadingIds = { used: new Set(), nextSuffix: new Map() }
  try {
    const options: EvaluateOptions = {
      ...runtime,
      remarkPlugins: [remarkGfm],
      rehypePlugins: [projectHeadings(headings, ids), [rehypePrettyCode, rehypePrettyCodeOptions]],
      baseUrl: import.meta.url,
    }

    const { default: MDXContent } = (await evaluate(source, options)) as {
      default: MDXComponent
    }

    return {
      content: <RenderPreparedContent MDXContent={MDXContent} staticIds={ids} additionalComponents={additionalComponents} />,
      headings,
    }
  } catch (error) {
    console.error(`Error rendering MDX (scope=${scope}):`, error)
    return {
      content: (
        <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4">
          An error occurred while rendering the content.
        </div>
      ),
      headings: [],
    }
  }
}

export async function ContentMDX(props: ContentMdxProps) {
  return (await prepareContentMDX(props)).content
}
