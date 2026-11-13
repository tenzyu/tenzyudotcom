import type { MDXComponents } from 'mdx/types'
import { ContentMDX } from '../../_features/content-mdx'
import { blogMdxComponents } from './mdx-components'

type CustomMDXProps = {
  source: string
  additionalComponents?: MDXComponents
}

/**
 * Backwards-compatible blog MDX renderer.
 *
 * Thin shim over the shared {@link ContentMDX} renderer that injects the
 * blog-flavored component overrides. New callers should use
 * {@link ContentMDX} directly with their own `additionalComponents`.
 */
export async function CustomMDX({
  source,
  additionalComponents,
}: CustomMDXProps) {
  return (
    <ContentMDX
      source={source}
      scope="blog"
      additionalComponents={{
        ...blogMdxComponents,
        ...(additionalComponents ?? {}),
      }}
    />
  )
}
