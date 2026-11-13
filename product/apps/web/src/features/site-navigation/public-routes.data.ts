export type PublicRouteGroupId = 'core' | 'around'
export type PublicRouteId = keyof typeof PUBLIC_ROUTES

export const PUBLIC_ROUTES = {
  blog: { href: '/blog', groupId: 'core' },
  notes: { href: '/notes', groupId: 'core' },
  scraps: { href: '/scraps', groupId: 'core' },
  links: { href: '/links', groupId: 'core' },
  tools: { href: '/tools', groupId: 'core' },
  osu: { href: '/osu', groupId: 'around' },
  portfolio: { href: '/portfolio', groupId: 'around' },
} as const satisfies Record<
  string,
  { href: string; groupId: PublicRouteGroupId }
>

export const PUBLIC_ROUTE_GROUPS = [
  { id: 'core', routeIds: ['blog', 'notes', 'scraps', 'links', 'tools'] },
  { id: 'around', routeIds: ['osu', 'portfolio'] },
] as const satisfies readonly {
  id: PublicRouteGroupId
  routeIds: readonly PublicRouteId[]
}[]

export const PRIMARY_NAV_ROUTE_IDS = [
  'blog',
  'notes',
  'scraps',
  'links',
  'tools',
  'osu',
  'portfolio',
] as const satisfies readonly PublicRouteId[]

export type PrimaryNavRouteId = (typeof PRIMARY_NAV_ROUTE_IDS)[number]
