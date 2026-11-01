import type { MetadataRoute } from 'next'

export const STATIC_SITEMAP_ROUTE_PATHS = [
  '/',
  '/blog',
  '/links',
  '/notes',
  '/osu',
  '/portfolio',
  '/scraps',
  '/tools',
] as const

export const ROBOTS_RULES: MetadataRoute.Robots['rules'] = {
  userAgent: '*',
  allow: ['/'],
}
