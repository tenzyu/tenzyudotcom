import { BASE_URL, buildOgTitleImageUrl, getAbsoluteUrl } from '@/config/site'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'

export const buildBlogPostUrl = (slug: string, locale: string) =>
  `${BASE_URL}${buildLocalizedUrl(`/blog/${slug}`, locale)}`

export const buildBlogPostImageUrl = (title: string, image?: string) =>
  image ? getAbsoluteUrl(image) : buildOgTitleImageUrl(title)

export * from '@tenzyu/publishing-domain/blog'
