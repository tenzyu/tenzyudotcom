import type { MDXComponents } from 'mdx/types'
import { OtakuAside } from '../../_features/otaku-aside'
import { CautionAlert } from './caution-alert'

/**
 * Blog-specific MDX component overrides.
 *
 * Generic heading/link/iframe components live in the shared `ContentMDX`
 * renderer co-located under `(main)/_features/content-mdx.tsx`. This module
 * only adds blog-flavored extras (OtakuAside, CautionAlert) so the blog
 * renderer can stay route-local.
 */
export const blogMdxComponents: MDXComponents = {
  OtakuAside,
  CautionAlert,
}

export function createMdxComponents(): MDXComponents {
  return { ...blogMdxComponents }
}
