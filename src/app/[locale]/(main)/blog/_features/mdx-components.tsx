import type { MDXComponents } from 'mdx/types'

import { KoFiLink } from '@/app/[locale]/_features/shell/kofi-link'
import { OtakuAside } from '../../_features/otaku-aside'
import { CautionAlert } from './caution-alert'

export const components: MDXComponents = {
  OtakuAside,
  CautionAlert,
  KoFiLink,
}
