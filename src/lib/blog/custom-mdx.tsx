import { type EvaluateOptions, evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkGfm from 'remark-gfm'

import type * as React from 'react'

import { components } from '../../app/mdx-components'

type MDXProps = {
  components?: Record<string, React.ComponentType<Record<string, unknown>>>
}

type MDXComponent = React.ComponentType<MDXProps>

type CustomMDXProps = {
  source: string
  additionalComponents?: Record<
    string,
    React.ComponentType<Record<string, unknown>>
  >
}

const rehypePrettyCodeOptions = {
  theme: 'github-dark',
  keepBackground: true,
  defaultLang: 'plaintext',
}

/**
 * Renders MDX content with provided components
 *
 * This component evaluates MDX source content and renders it with the provided components.
 * It passes the React runtime directly to the MDX evaluator to avoid React version conflicts,
 * which is a common issue in Next.js 15.2.0+ with MDX libraries.
 */
export async function CustomMDX({
  source,
  additionalComponents,
}: CustomMDXProps) {
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

    const mergedComponents = {
      ...components,
      ...(additionalComponents ?? {}),
    }

    return <MDXContent components={mergedComponents} />
  } catch (error) {
    console.error('Error rendering MDX:', error)
    return (
      <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-4">
        {/* TODO: i18n */}
        An error occurred while rendering the content.
      </div>
    )
  }
}
