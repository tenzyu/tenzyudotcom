'use client'

import { toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { type Handler, toHast } from 'mdast-util-to-hast'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

type ParsedNode = Parameters<typeof toHast>[0]
const markdown = unified().use(remarkParse).use(remarkGfm)
const mdx = unified().use(remarkParse).use(remarkGfm).use(remarkMdx)

export function SourcePreview({
  source,
  locale,
}: {
  source: string
  locale: string
}) {
  const ja = locale === 'ja'
  let parsed: ReturnType<typeof mdx.parse>
  let syntaxIssue: string | undefined
  try {
    parsed = mdx.parse(source)
  } catch (error) {
    parsed = markdown.parse(source)
    syntaxIssue = error instanceof Error ? error.message : String(error)
  }

  const unsupported: Handler = (_state, node: ParsedNode) => ({
    type: 'element',
    tagName: 'code',
    properties: {},
    children: [
      {
        type: 'text',
        value: ja
          ? `未対応の MDX（${node.position?.start.line ?? '?'} 行）`
          : `Unsupported MDX at line ${node.position?.start.line ?? '?'}`,
      },
    ],
  })

  const literal: Handler = (state, node: ParsedNode, parent) => {
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement')
      return unsupported(state, node, parent)
    if (
      !node.attributes.every(
        (attribute) =>
          attribute.type === 'mdxJsxAttribute' &&
          (typeof attribute.value === 'string' || attribute.value === null),
      )
    ) {
      return unsupported(state, node, parent)
    }
    const label = node.attributes.find(
      (attribute) =>
        attribute.type === 'mdxJsxAttribute' && attribute.name === 'label',
    )
    if (node.name === 'KoFiLink') {
      return {
        type: 'element',
        tagName: 'span',
        properties: { className: ['rounded', 'border', 'px-2', 'py-1'] },
        children: [
          {
            type: 'text',
            value:
              label?.type === 'mdxJsxAttribute' &&
              typeof label.value === 'string'
                ? label.value
                : 'KoFiLink',
          },
        ],
      }
    }
    if (node.name === 'Evidence' || node.name === 'Decision') {
      const heading = { type: 'text', value: node.name } as const
      if (node.type === 'mdxJsxTextElement')
        return [heading, ...state.all(node)]
      return {
        type: 'element',
        tagName: 'blockquote',
        properties: {},
        children: [heading, ...state.all(node)],
      }
    }
    return unsupported(state, node, parent)
  }

  const tree = toHast(parsed, {
    handlers: {
      mdxJsxFlowElement: literal,
      mdxJsxTextElement: literal,
      mdxFlowExpression: unsupported,
      mdxTextExpression: unsupported,
      mdxjsEsm: unsupported,
      html: unsupported,
    },
  })
  const preview =
    tree &&
    toJsxRuntime(tree, {
      Fragment,
      jsx,
      jsxs,
      components: {
        a: ({ children }) => <span className="underline">{children}</span>,
        img: ({ alt }) => <span>{alt ? `[${alt}]` : '[Image]'}</span>,
      },
    })
  return (
    <div className="min-w-0 space-y-2 rounded-lg border p-3">
      {syntaxIssue && (
        <p role="status" className="text-sm text-muted-foreground">
          {ja ? 'MDX の構文' : 'MDX syntax'} {syntaxIssue}
        </p>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none wrap-anywhere prose-pre:overflow-x-auto">
        {preview}
      </div>
    </div>
  )
}
