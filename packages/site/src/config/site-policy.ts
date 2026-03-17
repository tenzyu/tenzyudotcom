import type { MetadataRoute } from 'next'

export const STATIC_SITEMAP_ROUTE_PATHS = [
  '/',
  '/archives',
  '/blog',
  '/links',
  '/pointers',
  '/portfolio',
  '/puzzles',
  '/recommendations',
  '/tools',
] as const

export const ROBOTS_RULES: MetadataRoute.Robots['rules'] = {
  userAgent: '*',
  allow: ['/'],
}
